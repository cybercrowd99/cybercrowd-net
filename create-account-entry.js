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
// HUMAN STARTER:
// THE GLASS PLAQUE SWIPE IS THE HOLD / STARTER.
//
// CONNECTS:
// create-account-glass-plaque-node.js
// create-account-swipe-cue.js
// placard-swipe.js
// create-account-turn-audio-listener.js
// create-account-face-turn.js
// create-account-face-two-reveal.js
// human-verify-start.js
//
// DOES NOT CONNECT DURING STATE 0:
// create-account-lock-touch.js
// create-account-lock-touch-listener.js
// create-account-email-send-surface.js
// create-account-email-descriptor-activation.js
// create-account-email-descriptor-response.js
// create-account-send-action.js
// create-account-flow.js
//
// DOES NOT OWN:
// Glass-plaque node creation.
// Swipe-cue presentation.
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
  installGlassPlaqueNode();
  installSwipeCue();

  installTurnAudioListener();
  installPlacardSwipe();

  installFaceTurn();
  installFaceTwoReveal();

  startHumanVerify();
}

startCreateAccountEntry();
