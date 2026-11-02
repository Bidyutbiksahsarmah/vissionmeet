# VisionMeet

Meeting-intelligence platform: Chrome/Edge extension (capture) + Next.js web app + FastAPI backend. All AI runs in the cloud.

---

## Directory structure

```
visionmeet/
  backend/           FastAPI backend (auth, meetings, tasks, whisper, gemini extraction)
  frontend/          Next.js 14 web app (Tailwind CSS, design system, dark/light mode)
  extension/         Chrome/Edge Manifest V3 extension (tabCapture, popup UI)
  tests/             pytest unit and integration test suites
```

---

## Backend setup

```bash
cd backend
python -m venv .venv

# On Windows (PowerShell)
.venv\Scripts\activate

# On macOS / Linux
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure secrets
copy .env.example .env   # On Windows
cp .env.example .env     # On macOS/Linux

# Start API server
uvicorn app.main:app --reload --port 8000
```

The interactive API documentation is accessible at `http://localhost:8000/docs`.

### Run tests

```bash
cd backend
pytest -v
```

---

## Frontend setup

```bash
cd frontend
npm install
npm run dev
```

The web app will run at `http://localhost:3000`.

---

## Chrome / Edge extension setup

1. Open `chrome://extensions` (or `edge://extensions`) in your browser.
2. Enable **Developer mode** toggle in the top right.
3. Click **Load unpacked** and select the `extension/` directory.
4. Pin the VisionMeet extension icon in your browser toolbar.
5. Click the extension popup to sign in, verify consent, and start tab recording.

---

## Design and product conventions

- Neutral sans font (Inter) for UI; IBM Plex Mono for timestamps and code.
- Sentence case across all headings and buttons.
- Deep navy primary color (`#1F3A5F`), muted teal accent (`#0F766E`).
- No purple, no gradients, no emojis anywhere in code, comments, or UI.
- All extracted tasks include timestamp and verbatim evidence quote.
