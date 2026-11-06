const API_BASE = "http://localhost:8000";

let mediaRecorder = null;
let audioChunks = [];
let stream = null;
let audioContext = null;
let currentMeetingId = null;

function getStoredValues(keys) {
  return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
}

async function getToken() {
  const values = await getStoredValues(["visionmeet_token"]);
  return values.visionmeet_token || null;
}

async function createMeeting(title) {
  const token = await getToken();
  const response = await fetch(`${API_BASE}/meetings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ title, platform: "browser" }),
  });
  if (!response.ok) throw new Error("Could not create meeting session");
  return response.json();
}

async function startRecording(streamId, title) {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    return;
  }

  const meeting = await createMeeting(title);
  currentMeetingId = meeting.id;
  await chrome.storage.local.set({
    current_meeting_id: currentMeetingId,
    is_recording: true,
    recording_start_time: Date.now(),
  });

  stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      mandatory: {
        chromeMediaSource: "tab",
        chromeMediaSourceId: streamId,
      },
    },
    video: false,
  });

  audioContext = new AudioContext();
  const source = audioContext.createMediaStreamSource(stream);
  source.connect(audioContext.destination);

  audioChunks = [];
  mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
  mediaRecorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) audioChunks.push(event.data);
  };
  mediaRecorder.start(1000);
}

function stopRecorder() {
  return new Promise((resolve) => {
    if (!mediaRecorder || mediaRecorder.state === "inactive") {
      resolve();
      return;
    }
    mediaRecorder.addEventListener("stop", resolve, { once: true });
    mediaRecorder.stop();
  });
}

async function stopRecording() {
  await stopRecorder();
  if (stream) stream.getTracks().forEach((track) => track.stop());
  if (audioContext) await audioContext.close();

  const meetingId = currentMeetingId;
  const token = await getToken();
  if (!meetingId || !token) throw new Error("Recording session is missing authentication");

  const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
  const formData = new FormData();
  formData.append("file", audioBlob, `meeting_${meetingId}.webm`);

  const uploadResponse = await fetch(`${API_BASE}/meetings/${meetingId}/upload-audio`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!uploadResponse.ok) throw new Error("Audio upload failed");

  const processResponse = await fetch(`${API_BASE}/meetings/${meetingId}/process`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!processResponse.ok) throw new Error("Meeting processing failed");

  await chrome.storage.local.set({ current_meeting_id: meetingId });
  await chrome.storage.local.remove(["is_recording", "recording_start_time"]);
  mediaRecorder = null;
  stream = null;
  audioChunks = [];
  currentMeetingId = null;
  return meetingId;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "start-recording") {
    startRecording(message.streamId, message.title)
      .then(() => sendResponse({ ok: true }))
      .catch(async (error) => {
        await chrome.storage.local.remove(["is_recording", "recording_start_time"]);
        sendResponse({ ok: false, error: error.message });
      });
    return true;
  }

  if (message.type === "stop-recording") {
    stopRecording()
      .then((meetingId) => sendResponse({ ok: true, meetingId }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }
});
