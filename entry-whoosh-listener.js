// entry-whoosh-listener.js
// CyberCrowd — WHOOSH / HURRY BACK Listener
// JOB: Listen for the success event and trigger existing overlay + audio.
// DOES NOT modify UI directly. Calls your existing functions only.

export function installWhooshListener({
  playWhoosh,
  showCheckEmailOverlay
}) {
  window.addEventListener("cybercrowd:email-sent", () => {
    try {
      // These functions already exist in your system.
      // We DO NOT rewrite them. We DO NOT touch their files.
      playWhoosh();
      showCheckEmailOverlay();
    } catch (err) {
      console.error("WHOOSH listener error:", err);
    }
  });
}
