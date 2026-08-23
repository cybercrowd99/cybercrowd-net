// CYBERCROWD
//
// REPO: cybercrowd99/cybercrowd-net
// PATH: create-account-entry.js
//
// BUILD LAW:
// 1 FILE
// 1 JOB
// 1 FUNCTION
//
// JOB:
// Start the bounded Create Account entry components.
//
// FUNCTION:
// startCreateAccountEntry()
//
// CONNECTS:
// placard-swipe.js
// human-verify-start.js
// turnstile-one-ui.js
//
// DOES NOT OWN:
// Swipe math.
// Cylinder geometry.
// Turnstile rendering.
// Turnstile token creation.
// Human verification decision.
// Email.
// Send.
// Authentication.
// Session.
// Routing.
// Backend authority.

import {
  installPlacardSwipe
} from "./placard-swipe.js";

import {
  startHumanVerify
} from "./human-verify-start.js";

import {
  openTurnstileOne
} from "./turnstile-one-ui.js";

function startCreateAccountEntry() {
  installPlacardSwipe();
  startHumanVerify();
  openTurnstileOne();
}

startCreateAccountEntry();
