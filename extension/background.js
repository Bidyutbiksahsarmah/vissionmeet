async function ensureOffscreenDocument() {
  const offscreenUrl = chrome.runtime.getURL("offscreen.html");
  const contexts = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
    documentUrls: [offscreenUrl],
  });

  if (contexts.length === 0) {
    await chrome.offscreen.createDocument({
      url: "offscreen.html",
      reasons: ["USER_MEDIA"],
      justification: "Record meeting tab audio after the extension popup closes.",
    });
  }
}

async function sendToOffscreen(message) {
  await ensureOffscreenDocument();
  return chrome.runtime.sendMessage(message);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "ensure-offscreen") {
    ensureOffscreenDocument()
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === "start-recording" || message.type === "stop-recording") {
    sendToOffscreen(message)
      .then((response) => sendResponse(response || { ok: false, error: "No response from recorder" }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }
});
