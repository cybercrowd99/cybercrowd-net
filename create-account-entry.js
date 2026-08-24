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
// SEQUENCE #1 HUMAN CIRCUIT:
//
// HUMAN SEES
// ↓
// glass plaque
// face one
// swipe interface
//
// HUMAN SWIPES
// ↓
// movement #1
// sound
// 0° → 90°
//
// STOP

import {
  installGlassPlaqueNode
} from "./create-account-glass-plaque-node.js";

import {
  installFaceOne
} from "./create-account-face-one.js";

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

  installFaceOne();
  installSwipeCue();

  installTurnAudioListener();
  installPlacardSwipe();

  installFaceTurn();
  installFaceTwoReveal();

  startHumanVerify();
}

startCreateAccountEntry();
