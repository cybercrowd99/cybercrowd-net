// CyberCrowd Turnstile Client – Browser Token Only
// No secrets. No authority. No pass/fail. No KV. No session. No cookie.

// The page using this file must include:
// <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>

let widgetId = null;

// Render the Turnstile widget into a given DOM element
export function renderTurnstile(slotId, siteKey) {
  if (!window.turnstile) {
    console.warn("Turnstile not yet loaded.");
    return;
  }

  widgetId = window.turnstile.render(`#${slotId}`, {
    sitekey: siteKey,
    callback: function(token) {
      // Token is returned to caller via getTurnstileToken()
      lastToken = token;
    }
  });
}

let lastToken = "";

// Return the most recent browser token
export function getTurnstileToken() {
  return lastToken;
}

// Reset widget (visual only)
export function resetTurnstile() {
  if (window.turnstile && widgetId) {
    window.turnstile.reset(widgetId);
    lastToken = "";
  }
}
