# VisionMeet
Meeting-intelligence platform: Chrome/Edge extension (capture) + Next.js web app + FastAPI backend. All AI runs in the cloud; no local models, no .exe.

## Fixed decisions (ask before changing)
- Anyone can assign a task to anyone. Assigner = speaker, assignee = person addressed. Roles are display labels only.
- Extension starts capture only on explicit user click.
- No live transcript; analysis runs after the meeting ends.
- Human review of extracted tasks before they reach assignees.
- No activity monitoring of assignees.
- Emotion analysis is opt-in, shown as trends only.
- Follow docs/design.md. No purple/violet/indigo, no gradients, no emoji anywhere (UI, code, comments, commits).

## Phase 1 setup
- Backend: FastAPI + Pydantic + SQLAlchemy with SQLite (keep models PostgreSQL-compatible). No Celery or Redis yet.
- LLM: Claude API for task extraction, JSON validated with Pydantic.

## Conventions
- Type hints everywhere; tests for every feature.
- Secrets only in environment variables, never in code.
- Keep changes small and explain them.