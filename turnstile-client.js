// CYBERCROWD
// FILE NAME: turnstile-client.js
// TITLE: Turnstile Browser Token Client
// JOB: Render Cloudflare Turnstile and publish the real browser token.
// FUNCTION: renderTurnstile(slotId, siteKey)
// BUILD LAW: 1 FILE / 1 JOB / 1 FUNCTION
// LOCATION: REPOSITORY ROOT
// DO NOT NEST
// NO AUTH
// NO KV
// NO SESSION
// NO COOKIE
// NO BACKEND DECISION

export function renderTurnstile(slotId, siteKey) {
  if (!window.turnstile) {
    console.warn("Turnstile not yet loaded.");
    return false;
  }

  window.turnstile.render(`#${slotId}`, {
    sitekey: siteKey,

    callback(token) {
      window.dispatchEvent(
        new CustomEvent("cybercrowd:human-passed", {
          detail: {
            token
          }
        })
      );
    }
  });

  return true;
}
