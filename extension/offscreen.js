const API_BASE = "http://localhost:8000";

let mediaRecorder = null;
let audioChunks = [];
let stream = null;
let audioContext = null;
let currentMeetingId = null;
let authToken = null;

function authHeaders() {
  return { Authorization: `Bearer ${authToken}` };
}

async function createMeeting(title) {
  const response = await fetch(`${API_BASE}/meetings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ title, platform: "browser" }),
  });
  if (!response.ok) throw new Error("Could not create meeting session");
  return response.json();
}

async function startRecording(streamId, title) {
  if (mediaRecorder && mediaRecorder.state !== "inactive") return;
  if (!authToken) throw new Error("Recording session is missing authentication");

  const meeting = await createMeeting(title);
  currentMeetingId = meeting.id;

  try {
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
    const options = MediaRecorder.isTypeSupported("audio/webm")
      ? { mimeType: "audio/webm" }
      : undefined;
    mediaRecorder = new MediaRecorder(stream, options);
    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) audioChunks.push(event.data);
    };
    mediaRecorder.start(1000);
    const recordingStartTime = Date.now();
    return {
      meetingId: currentMeetingId,
      recordingStartTime,
    };
  } catch (error) {
    if (stream) stream.getTracks().forEach((track) => track.stop());
    if (audioContext) await audioContext.close();
    stream = null;
    audioContext = null;
    currentMeetingId = null;
    throw error;
  }
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
  if (!meetingId || !authToken) {
    throw new Error("Recording session is missing authentication");
  }

  const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
  const formData = new FormData();
  formData.append("file", audioBlob, `meeting_${meetingId}.webm`);

  const uploadResponse = await fetch(
    `${API_BASE}/meetings/${meetingId}/upload-audio`,
    {
      method: "POST",
      headers: authHeaders(),
      body: formData,
    }
  );
  if (!uploadResponse.ok) throw new Error("Audio upload failed");

  const processResponse = await fetch(`${API_BASE}/meetings/${meetingId}/process`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!processResponse.ok) throw new Error("Meeting processing failed");

  mediaRecorder = null;
  stream = null;
  audioChunks = [];
  currentMeetingId = null;
  authToken = null;
  return meetingId;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "start-recording") {
    authToken = message.token;
    startRecording(message.streamId, message.title)
      .then(({ meetingId, recordingStartTime }) =>
        sendResponse({ ok: true, meetingId, recordingStartTime })
      )
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === "stop-recording") {
    stopRecording()
      .then((meetingId) => sendResponse({ ok: true, meetingId }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }
});
