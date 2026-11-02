from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models import Comment, Meeting, Task, User
from app.schemas import (
    TASK_STATUS_VALUES,
    CommentCreate,
    CommentResponse,
    TaskCreate,
    TaskDetailResponse,
    TaskResponse,
    TaskUpdate,
)

router = APIRouter(tags=["tasks"])


@router.get("/tasks/assigned-to-me", response_model=List[TaskResponse])
def get_tasks_assigned_to_me(
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[Task]:
    """Retrieve tasks assigned to the current user."""
    query = db.query(Task).filter(
        (Task.assignee_id == current_user.id)
        | (Task.assignee_name == current_user.name)
    )
    if status_filter:
        query = query.filter(Task.status == status_filter)
    return query.order_by(Task.created_at.desc()).all()


@router.get("/tasks/assigned-by-me", response_model=List[TaskResponse])
def get_tasks_assigned_by_me(
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[Task]:
    """Retrieve tasks assigned by the current user."""
    query = db.query(Task).filter(
        (Task.assigner_id == current_user.id)
        | (Task.assigner_name == current_user.name)
    )
    if status_filter:
        query = query.filter(Task.status == status_filter)
    return query.order_by(Task.created_at.desc()).all()


@router.get("/tasks/needs-review", response_model=List[TaskResponse])
def get_tasks_needing_review(
    meeting_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[Task]:
    """Retrieve tasks flagged for human review."""
    query = db.query(Task).filter(
        (Task.needs_review == True) | (Task.status == "extracted")
    )
    if meeting_id:
        query = query.filter(Task.meeting_id == meeting_id)
    return query.order_by(Task.created_at.desc()).all()


@router.get("/meetings/{meeting_id}/tasks", response_model=List[TaskResponse])
def get_meeting_tasks(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[Task]:
    """List all action items for a given meeting."""
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found"
        )
    return (
        db.query(Task)
        .filter(Task.meeting_id == meeting_id)
        .order_by(Task.id.asc())
        .all()
    )


@router.post(
    "/meetings/{meeting_id}/tasks",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_task_for_meeting(
    meeting_id: int,
    payload: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Task:
    """Manually create a new task in a meeting."""
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found"
        )

    task = Task(
        meeting_id=meeting_id,
        description=payload.description,
        assigner_id=payload.assigner_id or current_user.id,
        assignee_id=payload.assignee_id,
        assigner_name=payload.assigner_name or current_user.name,
        assignee_name=payload.assignee_name,
        evidence_quote=payload.evidence_quote,
        evidence_timestamp=payload.evidence_timestamp,
        confidence=payload.confidence,
        needs_review=payload.needs_review,
        deadline=payload.deadline,
        status="confirmed",
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.get("/tasks/{task_id}", response_model=TaskDetailResponse)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Task:
    """Get task details along with comments and blocker notes."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )
    return task


@router.patch("/tasks/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    payload: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Task:
    """Update task fields, assignee, status, or deadline."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )

    update_dict = payload.model_dump(exclude_unset=True)
    if "status" in update_dict:
        if update_dict["status"] not in TASK_STATUS_VALUES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status. Must be one of: {list(TASK_STATUS_VALUES)}",
            )

    for key, val in update_dict.items():
        setattr(task, key, val)

    db.commit()
    db.refresh(task)
    return task


@router.post("/tasks/{task_id}/confirm", response_model=TaskResponse)
def confirm_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Task:
    """Human review approval: moves task from extracted/needs_review to confirmed."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )

    task.status = "confirmed"
    task.needs_review = False
    db.commit()
    db.refresh(task)
    return task


@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """Delete a task."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )
    db.delete(task)
    db.commit()


@router.post(
    "/tasks/{task_id}/comments",
    response_model=CommentResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_comment(
    task_id: int,
    payload: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Comment:
    """Add a discussion comment or blocker note to a task."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )

    comment = Comment(
        task_id=task_id,
        user_id=current_user.id,
        body=payload.body,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment


@router.get("/tasks/{task_id}/comments", response_model=List[CommentResponse])
def list_comments(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[Comment]:
    """List all comments on a task."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )
    return (
        db.query(Comment)
        .filter(Comment.task_id == task_id)
        .order_by(Comment.created_at.asc())
        .all()
    )
