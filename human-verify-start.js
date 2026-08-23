// CYBERCROWD
//
// FILE: human-verify-start.js
//
// BUILD LAW:
// 1 FILE
// 1 JOB
// 1 FUNCTION
//
// JOB:
// Start the existing human-verification crossing.
//
// FUNCTION:
// startHumanVerify()
//
// TRACK:
// human-verify-start.js
// → human-verify-crossing.js
// → human-verify-client.js
// → /api/auth/human-verify
//
// DOES NOT OWN:
// Turnstile rendering.
// Turnstile token creation.
// Human verification.
// Network implementation.
// Human-pass creation.
// Email.
// Authentication.
// Session.
// UI.
// Routing.

import {
  openHumanVerifyCrossing
} from "./human-verify-crossing.js";

export function startHumanVerify() {
  openHumanVerifyCrossing();
}
