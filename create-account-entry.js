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
// SEQUENCE #1:
// PLAQUE ONLY.
// SWIPE WINDOW ONLY.
//
// CONNECTS:
// create-account-lock-touch.js
// create-account-lock-touch-listener.js
// create-account-glass-plaque-node.js
// create-account-swipe-cue.js
// placard-swipe.js
// create-account-turn-audio-listener.js
// create-account-face-turn.js
// create-account-face-two-reveal.js
// human-verify-start.js
//
// DOES NOT CONNECT DURING SEQUENCE #1:
// create-account-email-send-surface.js
// create-account-email-descriptor-activation.js
// create-account-email-descriptor-response.js
// create-account-send-action.js
// create-account-flow.js
//
// DOES NOT OWN:
// Glass-plaque node creation.
// Swipe-cue presentation.
// Lock-touch behavior.
// Lock-touch response.
// Swipe math.
// Movement #1.
// Movement #2.
// Movement #3.
// Cylinder geometry.
// Turn audio generation.
// Face-two reveal decision.
// Email + Send DOM creation.
// Email descriptor activation behavior.
// Email descriptor response behavior.
// Send click behavior.
// Email + Send exposure behavior.
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
  installLockTouch
} from "./create-account-lock-touch.js";

import {
  installLockTouchListener
} from "./create-account-lock-touch-listener.js";

import {
  installGlassPlaqueNode
} from "./create-account-glass-plaque-node.js";

import {
  installSwipeCue
} from "./create-account-swipe-cue.js";

import {
  installPlacardSwipe
} from "./placard-swipe.js";

import {
  installTurnAudioListener
} from "./create-account-turn-audio-listener.js";

import {
  installFaceTurn
} from "./create-account-face-turn.js";

import {
  installFaceTwoReveal
} from "./create-account-face-two-reveal.js";

import {
  startHumanVerify
} from "./human-verify-start.js";

function startCreateAccountEntry() {
  installLockTouch();

  installGlassPlaqueNode();
  installSwipeCue();

  installLockTouchListener();
  installTurnAudioListener();
  installPlacardSwipe();

  installFaceTurn();
  installFaceTwoReveal();

  startHumanVerify();
}

startCreateAccountEntry();
