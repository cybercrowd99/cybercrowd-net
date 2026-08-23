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
// create-account-turn-audio-listener.js
// human-verify-start.js
// turnstile-one-ui.js
//
// DOES NOT OWN:
// Swipe math.
// Cylinder geometry.
// Turn audio generation.
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
  installTurnAudioListener
} from "./create-account-turn-audio-listener.js";

import {
  startHumanVerify
} from "./human-verify-start.js";

import {
  openTurnstileOne
} from "./turnstile-one-ui.js";

function startCreateAccountEntry() {
  installTurnAudioListener();
  installPlacardSwipe();
  startHumanVerify();
  openTurnstileOne();
}

startCreateAccountEntry();
