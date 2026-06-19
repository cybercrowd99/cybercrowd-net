// CyberCrowd Check Email Overlay – Visual Feedback Only
// No Turnstile. No token. No KV. No session. No cookie. No authority.

// Elements
const overlay = document.getElementById("check-email-overlay");
const closeBtn = document.getElementById("overlay-close");
const whooshAudio = document.getElementById("whoosh-audio");

// Show overlay after route success
export function showCheckEmailOverlay() {
  if (overlay) {
    overlay.style.display = "flex";

    // Optional whoosh sound (non-authority)
    if (whooshAudio) {
      try {
        whooshAudio.currentTime = 0;
        whooshAudio.play();
      } catch (_) {
        // Audio failure is non-critical; ignore silently
      }
    }
  }
}

// Allow user to dismiss overlay (visual only)
function hideOverlay() {
  if (overlay) {
    overlay.style.display = "none";
  }
}

// Bind close button if present
if (closeBtn) {
  closeBtn.addEventListener("click", hideOverlay);
}
