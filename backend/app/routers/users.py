from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models import User
from app.schemas import UserSimple

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=List[UserSimple])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[User]:
    """List team members in the workspace."""
    return db.query(User).order_by(User.name.asc()).all()
