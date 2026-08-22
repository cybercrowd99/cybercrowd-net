// CYBERCROWD
// REPO: cybercrowd99/cybercrowd-net
// PATH: entry-human-pass.js
//
// BUILD LAW:
// 1 FILE
// 1 JOB
// 1 FUNCTION
//
// JOB:
// Read and return an already-established Cloudflare Turnstile human token.
//
// TRACK:
// HUMAN TOUCH
// → CLOUDFLARE TURNSTILE
// → HUMAN INTERACTION
// → TOKEN ALREADY EXISTS
// → HUMAN PASS RETURNS TOKEN
//
// SECURITY:
// This file does not execute Turnstile.
// This file does not create human proof.
// This file only accepts proof already created by the human-gate surface.
//
// RECOVERY LOCK:
// Frontend lane only.
// Backend frozen.
// No polling.
// No auto-execute.
// No new helper.
// No bridge.
// No envelope.

export async function runHumanPass(turnstileWidgetId) {
  if (
    !window.turnstile ||
    turnstileWidgetId === null ||
    turnstileWidgetId === undefined
  ) {
    return {
      human: false,
      token: null,
      reason: "turnstile-not-ready"
    };
  }

  try {
    const token =
      window.turnstile.getResponse(turnstileWidgetId);

    if (
      typeof token === "string" &&
      token.length > 0
    ) {
      return {
        human: true,
        token,
        reason: "human-token-ready"
      };
    }

    return {
      human: false,
      token: null,
      reason: "human-token-required"
    };

  } catch (err) {
    return {
      human: false,
      token: null,
      reason: "turnstile-exception",
      error: err?.message || "unknown"
    };
  }
}
