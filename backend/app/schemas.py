import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ---------------------------------------------------------------------------
# User schemas
# ---------------------------------------------------------------------------

class UserBase(BaseModel):
    email: EmailStr
    name: str = Field(min_length=1, max_length=255)


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserSimple(BaseModel):
    id: int
    name: str
    email: EmailStr

    model_config = ConfigDict(from_attributes=True)


class UserResponse(UserSimple):
    created_at: datetime.datetime


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: int


# ---------------------------------------------------------------------------
# Comment schemas
# ---------------------------------------------------------------------------

class CommentCreate(BaseModel):
    body: str = Field(min_length=1, max_length=5000)


class CommentResponse(BaseModel):
    id: int
    task_id: int
    user_id: int
    body: str
    created_at: datetime.datetime
    author: Optional[UserSimple] = None

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Task schemas
# ---------------------------------------------------------------------------

TASK_STATUS_VALUES = (
    "extracted",
    "confirmed",
    "accepted",
    "in_progress",
    "blocked",
    "in_review",
    "done",
)


class TaskCreate(BaseModel):
    description: str = Field(min_length=1)
    assigner_id: Optional[int] = None
    assignee_id: Optional[int] = None
    assigner_name: Optional[str] = None
    assignee_name: Optional[str] = None
    evidence_quote: Optional[str] = None
    evidence_timestamp: Optional[str] = None
    confidence: float = 1.0
    needs_review: bool = False
    deadline: Optional[datetime.datetime] = None


class TaskUpdate(BaseModel):
    description: Optional[str] = None
    status: Optional[str] = None
    assignee_id: Optional[int] = None
    assignee_name: Optional[str] = None
    assigner_id: Optional[int] = None
    assigner_name: Optional[str] = None
    evidence_quote: Optional[str] = None
    evidence_timestamp: Optional[str] = None
    needs_review: Optional[bool] = None
    deadline: Optional[datetime.datetime] = None


class TaskResponse(BaseModel):
    id: int
    meeting_id: int
    assigner_id: Optional[int] = None
    assignee_id: Optional[int] = None
    assigner_name: Optional[str] = None
    assignee_name: Optional[str] = None
    description: str
    status: str
    evidence_quote: Optional[str] = None
    evidence_timestamp: Optional[str] = None
    confidence: float
    needs_review: bool
    deadline: Optional[datetime.datetime] = None
    created_at: datetime.datetime
    assigner: Optional[UserSimple] = None
    assignee: Optional[UserSimple] = None

    model_config = ConfigDict(from_attributes=True)


class TaskDetailResponse(TaskResponse):
    comments: List[CommentResponse] = []


# ---------------------------------------------------------------------------
# Meeting schemas
# ---------------------------------------------------------------------------

class MeetingCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    platform: str = "browser"
    meeting_date: Optional[datetime.datetime] = None


class MeetingUpdate(BaseModel):
    title: Optional[str] = None
    platform: Optional[str] = None
    summary: Optional[str] = None
    transcript: Optional[str] = None
    status: Optional[str] = None


class MeetingResponse(BaseModel):
    id: int
    title: str
    platform: str
    status: str
    meeting_date: datetime.datetime
    created_at: datetime.datetime
    created_by: int
    creator: Optional[UserSimple] = None
    audio_path: Optional[str] = None
    task_count: int = 0
    needs_review_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class MeetingDetailResponse(BaseModel):
    id: int
    title: str
    platform: str
    status: str
    meeting_date: datetime.datetime
    created_at: datetime.datetime
    created_by: int
    audio_path: Optional[str] = None
    transcript: Optional[str] = None
    summary: Optional[str] = None
    creator: Optional[UserSimple] = None
    tasks: List[TaskResponse] = []

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# AI task extraction schemas (Pydantic validated)
# ---------------------------------------------------------------------------

class ExtractedTaskItem(BaseModel):
    """Schema expected from LLM JSON output for each task."""

    description: str = Field(description="Clear, actionable task description")
    assigner: Optional[str] = Field(
        default=None, description="Speaker name or role who assigned the task"
    )
    assignee: Optional[str] = Field(
        default=None, description="Person or role addressed to do the task"
    )
    evidence_quote: Optional[str] = Field(
        default=None, description="Exact or near-exact quote from transcript"
    )
    evidence_timestamp: Optional[str] = Field(
        default=None, description="Timestamp formatted as MM:SS or HH:MM:SS"
    )
    confidence: float = Field(
        default=1.0, ge=0.0, le=1.0, description="Extraction confidence score"
    )
    deadline_suggestion: Optional[str] = Field(
        default=None, description="Extracted verbal deadline if stated"
    )


class ExtractionResult(BaseModel):
    """Container for LLM extraction response."""

    summary: str = Field(description="Concise summary of the meeting")
    decisions: List[str] = Field(
        default_factory=list, description="Key decisions made in the meeting"
    )
    tasks: List[ExtractedTaskItem] = Field(
        default_factory=list, description="List of extracted action items"
    )
