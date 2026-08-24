// CYBERCROWD
//
// FILE:
// create-account-entry.js
//
// BUILD LAW:
// 1 FILE
// 1 JOB
// 1 FUNCTION
//
// JOB:
// Start the live Create Account stage.
//
// FUNCTION:
// startCreateAccountEntry()
//
// STAGE:
//
// Sequence #1
// ↓
// cybercrowd:cylinder-turned
// ↓
// existing Turnstile #1
// ↓
// existing verification crossing
// ↓
// cybercrowd:turnstile-one-verified
// ↓
// Sequence #2

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
  installTurnAudioListener
} from "./create-account-turn-audio-listener.js";

import {
  installPlacardSwipe
} from "./placard-swipe.js";

import {
  openTurnstileOne
} from "./turnstile-one-ui.js";

import {
  openHumanVerifyCrossing
} from "./human-verify-crossing.js";

import {
  installSequenceTwo
} from "./create-account-sequence-two.js";

function startCreateAccountEntry() {
  installGlassPlaqueNode();

  installFaceOne();

  installSwipeCue();

  installTurnAudioListener();

  openHumanVerifyCrossing();

  installSequenceTwo();

  window.addEventListener(
    "cybercrowd:cylinder-turned",
    openTurnstileOne,
    { once: true }
  );

  installPlacardSwipe();
}

startCreateAccountEntry();
