from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.dependencies import get_current_user
from app.models import User
from app.routers import auth, meetings, tasks, users

# Initialize database tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="VisionMeet API",
    description="Meeting-intelligence platform backend",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(meetings.router)
app.include_router(tasks.router)
app.include_router(users.router)


@app.get("/health")
def health_check() -> dict:
    """Basic health check endpoint."""
    return {"status": "ok"}


@app.get("/me")
def read_current_user(current_user: User = Depends(get_current_user)) -> dict:
    """Return the authenticated user's profile."""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
    }
