// entry-send-success.js
// CyberCrowd — Success Event Emitter
// JOB: Emit a clean success event for the existing WHOOSH/HURRY BACK system.
// NO UI logic. NO overlay manipulation. NO audio playback.

export function emitSendSuccess() {
  const event = new CustomEvent("cybercrowd:email-sent", {
    detail: {
      status: "sent",
      message: "EMAIL SENT"
    }
  });

  window.dispatchEvent(event);
}
