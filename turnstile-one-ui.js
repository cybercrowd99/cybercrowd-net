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
  installGlassPlaqueTwoNode
} from "./create-account-glass-plaque-two-node.js";

import {
  openTurnstileOne
} from "./turnstile-one-ui.js";

import {
  openHumanVerifyCrossing
} from "./human-verify-crossing.js";

import {
  installSequenceTwo
} from "./create-account-sequence-two.js";

import {
  installFaceTurn
} from "./create-account-face-turn.js";

function startCreateAccountEntry() {
  installGlassPlaqueNode();

  installFaceOne();

  installGlassPlaqueTwoNode();

  installSwipeCue();

  installTurnAudioListener();

  openHumanVerifyCrossing();

  installSequenceTwo();

  installFaceTurn();

  window.addEventListener(
    "cybercrowd:cylinder-turned",
    openTurnstileOne,
    { once: true }
  );

  installPlacardSwipe();
}

startCreateAccountEntry();
