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
// create-account-lock-touch.js
// create-account-lock-touch-listener.js
// create-account-turn-audio-listener.js
// create-account-face-turn.js
// human-verify-start.js
//
// DOES NOT OWN:
// Lock-touch behavior.
// Lock-touch response.
// Face-turn behavior.
// Turn audio generation.
// Turnstile rendering.
// Turnstile token creation.
// Human verification decision.
// Face-two reveal.
// Email.
// Send.
// WHOOSH.
// Authentication.
// Session.
// Routing.
// Backend authority.

import {
  installLockTouch
} from "./create-account-lock-touch.js";

import {
  installLockTouchListener
} from "./create-account-lock-touch-listener.js";

import {
  installTurnAudioListener
} from "./create-account-turn-audio-listener.js";

import {
  installFaceTurn
} from "./create-account-face-turn.js";

import {
  startHumanVerify
} from "./human-verify-start.js";

function startCreateAccountEntry() {
  installLockTouchListener();
  installLockTouch();
  installTurnAudioListener();
  installFaceTurn();
  startHumanVerify();
}

startCreateAccountEntry();
