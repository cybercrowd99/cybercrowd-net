// CYBERCROWD
//
// REPO: cybercrowd99/cybercrowd-net
// PATH: create-account-lock-touch-listener.js
//
// BUILD LAW:
// 1 FILE
// 1 JOB
// 1 FUNCTION
//
// JOB:
// Connect the Create Account lock-touch signal
// to the existing Turnstile-one surface owner.
//
// FUNCTION:
// installLockTouchListener()
//
// SIGNAL:
// cybercrowd:entry-lock-touched
//
// POINTS TO:
// turnstile-one-ui.js
//
// DOES NOT OWN:
// Lock-touch surface.
// Seal.
// Cylinder movement.
// Turn audio.
// Turnstile rendering math.
// Turnstile token creation.
// Human verification.
// Email.
// Send.
// Authentication.
// Session.
// Routing.
// Backend authority.

import {
  openTurnstileOne
} from "./turnstile-one-ui.js";

export function installLockTouchListener() {
  window.addEventListener(
    "cybercrowd:entry-lock-touched",
    () => {
      openTurnstileOne();
    }
  );
}
