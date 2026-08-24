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
// FLOW:
//
// Sequence #1
// ↓
// human swipe
// ↓
// cybercrowd:cylinder-turned
// ↓
// Slam #1 + Movement #1
// ↓
// cybercrowd:movement-one-landed
// ↓
// Glass #2 created
// ↓
// Turnstile Widget #1 attached
// ↓
// STOP
//
// NO AUDIO #2.
// NO VERIFICATION MOVEMENT.
// NO MOVEMENT #2.
// NO STORAGE.

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
  installGlassPlaqueTwoNode
} from "./create-account-glass-plaque-two-node.js";

import {
  openTurnstileOne
} from "./turnstile-one-ui.js";

import {
  installPlacardSwipe
} from "./placard-swipe.js";

function startCreateAccountEntry() {
  installGlassPlaqueNode();

  installFaceOne();

  installSwipeCue();

  installTurnAudioListener();

  installGlassPlaqueTwoNode();

  window.addEventListener(
    "cybercrowd:movement-one-landed",
    openTurnstileOne,
    { once: true }
  );

  installPlacardSwipe();
}

startCreateAccountEntry();
