// CYBERCROWD
//
// FILE:
// turnstile-two-pass-receiver.js
//
// BUILD LAW:
// 1 FILE
// 1 JOB
// 1 FUNCTION
//
// SEQUENCE:
// #4
//
// JOB:
// Receive the completed
// Turnstile #2 browser checkpoint.
//
// FUNCTION:
// installTurnstileTwoPassReceiver()
//
// INPUT:
// cybercrowd:turnstile-two-passed
//
// OUTPUT:
// cybercrowd:turnstile-two-token-ready
//
// BOUNDARY:
//
// Turnstile #2
// ↓
// cybercrowd:turnstile-two-passed
// ↓
// real browser token
// ↓
// cybercrowd:turnstile-two-token-ready
//
// DOES NOT OWN:
// Turnstile rendering.
// Turnstile #1.
// Email input.
// Email validation.
// SEND.
// Postmark.
// Email transmission.
// Verification email.
// WHOOSH.
// Authentication.
// Session.
// Cookie.
// KV.
// Routing.
// Backend authority.
// Movement.
// Rotation.

export function installTurnstileTwoPassReceiver() {
  window.addEventListener(
    "cybercrowd:turnstile-two-passed",
    (event) => {
      const token =
        event?.detail?.token;

      if (
        typeof token !== "string" ||
        token.length === 0
      ) {
        return;
      }

      window.dispatchEvent(
        new CustomEvent(
          "cybercrowd:turnstile-two-token-ready",
          {
            detail: {
              token
            }
          }
        )
      );
    }
  );
}
