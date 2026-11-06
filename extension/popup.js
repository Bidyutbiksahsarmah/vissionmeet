const API_BASE = "http://localhost:8000";
const WEB_BASE = "http://localhost:3000";

let mediaRecorder = null;
let audioChunks = [];
let stream = null;
let timerInterval = null;
let recordingStartTime = null;
let currentMeetingId = null;

// UI Elements
const stateSignedOut = document.getElementById("state-signed-out");
const stateReady = document.getElementById("state-ready");
const stateRecording = document.getElementById("state-recording");
const stateDone = document.getElementById("state-done");

const loginForm = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginError = document.getElementById("login-error");
const userBadge = document.getElementById("user-badge");

const meetingTitleInput = document.getElementById("meeting-title");
const consentCheckbox = document.getElementById("consent-checkbox");
const btnStart = document.getElementById("btn-start");
const btnStop = document.getElementById("btn-stop");
const btnOpenWeb = document.getElementById("btn-open-web");
const btnReset = document.getElementById("btn-reset");
const timerDisplay = document.getElementById("timer-display");

function showState(view) {
  stateSignedOut.classList.add("hidden");
  stateReady.classList.add("hidden");
  stateRecording.classList.add("hidden");
  stateDone.classList.add("hidden");
  view.classList.remove("hidden");
}

async function getToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["visionmeet_token", "visionmeet_user"], (res) => {
      resolve({
        token: res.visionmeet_token || null,
        user: res.visionmeet_user || null,
      });
    });
  });
}

async function setToken(token, user) {
  return new Promise((resolve) => {
    chrome.storage.local.set(
      { visionmeet_token: token, visionmeet_user: user },
      resolve
    );
  });
}

async function checkAuthAndState() {
  const { token, user } = await getToken();
  if (!token || !user) {
    userBadge.classList.add("hidden");
    showState(stateSignedOut);
    return;
  }

  userBadge.textContent = user.name;
  userBadge.classList.remove("hidden");

  // Check if a recording session was active
  chrome.storage.local.get(
    ["is_recording", "recording_start_time", "current_meeting_id"],
    (data) => {
      if (data.is_recording && data.recording_start_time) {
        recordingStartTime = data.recording_start_time;
        currentMeetingId = data.current_meeting_id || null;
        startTimerTicker();
        showState(stateRecording);
      } else if (data.current_meeting_id) {
        currentMeetingId = data.current_meeting_id;
        showState(stateReady);
      } else {
        showState(stateReady);
      }
    }
  );
}

// Login submission
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.classList.add("hidden");

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || "Authentication failed");
    }

    const data = await res.json();
    const token = data.access_token;

    // Fetch user profile
    const profileRes = await fetch(`${API_BASE}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const user = await profileRes.json();

    await setToken(token, user);
    userBadge.textContent = user.name;
    userBadge.classList.remove("hidden");
    showState(stateReady);
  } catch (err) {
    loginError.textContent = err.message;
    loginError.classList.remove("hidden");
  }
});

// Consent checkbox validation
consentCheckbox.addEventListener("change", () => {
  btnStart.disabled = !consentCheckbox.checked;
});

function startTimerTicker() {
  if (timerInterval) clearInterval(timerInterval);
  updateTimer();
  timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
  if (!recordingStartTime) return;
  const now = Date.now();
  const diffSecs = Math.max(0, Math.floor((now - recordingStartTime) / 1000));
  const hrs = Math.floor(diffSecs / 3600);
  const mins = Math.floor((diffSecs % 3600) / 60);
  const secs = diffSecs % 60;
  timerDisplay.textContent = [
    String(hrs).padStart(2, "0"),
    String(mins).padStart(2, "0"),
    String(secs).padStart(2, "0"),
  ].join(":");
}

function sendRuntimeMessage(message) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, resolve);
  });
}

// Delegate capture to the offscreen document because the popup is destroyed
// as soon as it loses focus.
btnStart.addEventListener("click", async () => {
  if (!consentCheckbox.checked) return;

  btnStart.disabled = true;
  try {
    const [activeTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!activeTab?.id) {
      throw new Error("Could not identify the active browser tab");
    }

    const streamId = await chrome.tabCapture.getMediaStreamId({
      targetTabId: activeTab.id,
    });
    const ensured = await sendRuntimeMessage({ type: "ensure-offscreen" });
    if (!ensured?.ok) {
      throw new Error(ensured?.error || "Could not start the recording service");
    }

    const title =
      meetingTitleInput.value.trim() ||
      `Meeting on ${new Date().toLocaleDateString()}`;
    const started = await sendRuntimeMessage({
      type: "start-recording",
      streamId,
      title,
    });
    if (!started?.ok) {
      throw new Error(started?.error || "Could not start recording");
    }

    const data = await new Promise((resolve) =>
      chrome.storage.local.get(
        ["recording_start_time", "current_meeting_id"],
        resolve
      )
    );
    recordingStartTime = data.recording_start_time || Date.now();
    currentMeetingId = data.current_meeting_id || null;
    startTimerTicker();
    showState(stateRecording);
  } catch (err) {
    alert(`Error: ${err.message}`);
    btnStart.disabled = false;
  }
});

btnStop.addEventListener("click", async () => {
  if (timerInterval) clearInterval(timerInterval);
  btnStop.disabled = true;
  btnStop.textContent = "Processing and uploading...";

  try {
    const stopped = await sendRuntimeMessage({ type: "stop-recording" });
    if (!stopped?.ok) {
      throw new Error(stopped?.error || "Could not stop recording");
    }
    currentMeetingId = stopped.meetingId;
    showState(stateDone);
  } catch (err) {
    alert(`Error: ${err.message}`);
    showState(stateReady);
  } finally {
    btnStop.disabled = false;
    btnStop.textContent = "Stop recording";
  }
});
// Open meeting in web app
btnOpenWeb.addEventListener("click", async () => {
  const { token } = await getToken();
  const tokenParam = token ? `?token=${encodeURIComponent(token)}` : "";
  if (currentMeetingId) {
    chrome.tabs.create({ url: `${WEB_BASE}/meetings/${currentMeetingId}${tokenParam}` });
  } else {
    chrome.tabs.create({ url: `${WEB_BASE}/meetings${tokenParam}` });
  }
});

// Reset
btnReset.addEventListener("click", () => {
  consentCheckbox.checked = false;
  btnStart.disabled = true;
  meetingTitleInput.value = "";
  timerDisplay.textContent = "00:00:00";
  chrome.storage.local.remove(["current_meeting_id", "is_recording", "recording_start_time"]);
  showState(stateReady);
});

// Initial boot
checkAuthAndState();
