from typing import List, Optional

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    HTTPException,
    UploadFile,
    status,
)
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.llm import extract_tasks
from app.models import Meeting, Task, User
from app.schemas import (
    MeetingCreate,
    MeetingDetailResponse,
    MeetingResponse,
    MeetingUpdate,
    TaskResponse,
    UserSimple,
)
from app.storage import delete_file_if_exists, save_uploaded_file
from app.transcription import transcribe_audio

router = APIRouter(prefix="/meetings", tags=["meetings"])


def _to_meeting_response(meeting: Meeting, db: Session) -> MeetingResponse:
    """Helper to compute task counts for list response."""
    task_count = (
        db.query(func.count(Task.id))
        .filter(Task.meeting_id == meeting.id)
        .scalar()
        or 0
    )
    needs_review_count = (
        db.query(func.count(Task.id))
        .filter(Task.meeting_id == meeting.id, Task.needs_review == True)
        .scalar()
        or 0
    )

    creator_simple = None
    if meeting.creator:
        creator_simple = UserSimple.model_validate(meeting.creator)

    return MeetingResponse(
        id=meeting.id,
        title=meeting.title,
        platform=meeting.platform,
        status=meeting.status,
        meeting_date=meeting.meeting_date,
        created_at=meeting.created_at,
        created_by=meeting.created_by,
        creator=creator_simple,
        audio_path=meeting.audio_path,
        task_count=task_count,
        needs_review_count=needs_review_count,
    )


@router.post(
    "",
    response_model=MeetingResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_meeting(
    payload: MeetingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MeetingResponse:
    """Create a new meeting session."""
    meeting = Meeting(
        title=payload.title,
        platform=payload.platform,
        created_by=current_user.id,
        status="ready",
    )
    if payload.meeting_date:
        meeting.meeting_date = payload.meeting_date

    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    return _to_meeting_response(meeting, db)


@router.get("", response_model=List[MeetingResponse])
def list_meetings(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[MeetingResponse]:
    """List meetings created by or accessible in the workspace."""
    meetings = (
        db.query(Meeting)
        .order_by(Meeting.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [_to_meeting_response(m, db) for m in meetings]


@router.get("/{meeting_id}", response_model=MeetingDetailResponse)
def get_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Meeting:
    """Get full details of a meeting including transcript and extracted tasks."""
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found",
        )
    return meeting


@router.patch("/{meeting_id}", response_model=MeetingDetailResponse)
def update_meeting(
    meeting_id: int,
    payload: MeetingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Meeting:
    """Update meeting metadata."""
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found",
        )

    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(meeting, field, val)

    db.commit()
    db.refresh(meeting)
    return meeting


@router.delete("/{meeting_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """Delete a meeting and its associated audio file."""
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found",
        )

    if meeting.audio_path:
        delete_file_if_exists(meeting.audio_path)

    db.delete(meeting)
    db.commit()


@router.post("/{meeting_id}/upload-audio", response_model=MeetingDetailResponse)
async def upload_meeting_audio(
    meeting_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Meeting:
    """Upload recorded audio for a meeting."""
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found",
        )

    # Clean previous audio file if replaced
    if meeting.audio_path:
        delete_file_if_exists(meeting.audio_path)

    stored_path = await save_uploaded_file(file, meeting_id=meeting_id)
    meeting.audio_path = stored_path
    meeting.status = "audio_uploaded"
    db.commit()
    db.refresh(meeting)
    return meeting


def _process_pipeline(meeting_id: int) -> None:
    """Background or inline execution of transcription and task extraction."""
    from app.database import SessionLocal
    import logging
    logger = logging.getLogger(__name__)

    db = SessionLocal()
    try:
        meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
        if not meeting or not meeting.audio_path:
            return

        # Step 1: Transcribe
        meeting.status = "transcribing"
        db.commit()

        transcription_result = transcribe_audio(meeting.audio_path)
        meeting.transcript = transcription_result["text"]
        db.commit()

        # Step 2: Extract tasks via LLM
        meeting.status = "extracting"
        db.commit()

        extraction = extract_tasks(meeting.transcript)
        meeting.summary = extraction.summary

        # Match assigner/assignee names to existing users if possible
        all_users = db.query(User).all()
        name_to_user = {u.name.lower(): u for u in all_users}

        for item in extraction.tasks:
            assignee_user = None
            if item.assignee:
                assignee_user = name_to_user.get(item.assignee.lower())

            assigner_user = None
            if item.assigner:
                assigner_user = name_to_user.get(item.assigner.lower())

            needs_review = item.confidence < 0.75

            task = Task(
                meeting_id=meeting.id,
                description=item.description,
                assigner_id=assigner_user.id if assigner_user else None,
                assignee_id=assignee_user.id if assignee_user else None,
                assigner_name=item.assigner,
                assignee_name=item.assignee,
                evidence_quote=item.evidence_quote,
                evidence_timestamp=item.evidence_timestamp,
                confidence=item.confidence,
                needs_review=needs_review,
                status="extracted",
            )
            db.add(task)

        meeting.status = "completed"
        db.commit()
    except Exception as exc:
        logger.exception(f"Error in meeting pipeline for meeting {meeting_id}: {exc}")
        meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
        if meeting:
            meeting.status = "failed"
            db.commit()
    finally:
        db.close()


@router.post("/{meeting_id}/process", response_model=MeetingDetailResponse)
def process_meeting(
    meeting_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Meeting:
    """Trigger the transcription and task extraction pipeline."""
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found",
        )
    if not meeting.audio_path:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Meeting has no audio uploaded",
        )

    # Run processing pipeline
    background_tasks.add_task(_process_pipeline, meeting_id=meeting.id)
    meeting.status = "processing"
    db.commit()
    db.refresh(meeting)
    return meeting
