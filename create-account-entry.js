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
// Sequence #1 CLOSED
// ↓
// Glass #2 created
// ↓
// Turnstile Widget #1 attached
// ↓
// cybercrowd:human-passed
// ↓
// private human verification
// ↓
// cybercrowd:turnstile-one-verified
// ↓
// Audio #2
// +
// automatic Movement #2
// ↓
// 90° → 180°
// ↓
// Sequence #3
// ↓
// ENTER EMAIL
// ↓
// SEND
// ↓
// cybercrowd:turnstile-two-requested
// ↓
// Turnstile Widget #2 attached
//
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
  installGlassPlaqueThreeNode
} from "./create-account-glass-plaque-three-node.js";

import {
  installEmailSendSurface
} from "./create-account-email-send-surface.js";

import {
  installEntryBridge
} from "./create-account-entry-bridge.js";

import {
  openTurnstileOne
} from "./turnstile-one-ui.js";

import {
  openTurnstileTwo
} from "./turnstile-two-ui.js";

import {
  openHumanVerifyCrossing
} from "./human-verify-crossing.js";

import {
  installSequenceOneRelease
} from "./create-account-sequence-one-release.js";

import {
  installSequenceTwo
} from "./create-account-sequence-two.js";

import {
  installSequenceTwoRelease
} from "./create-account-sequence-two-release.js";

import {
  installFaceTurn
} from "./create-account-face-turn.js";

import {
  installPlacardSwipe
} from "./placard-swipe.js";

function startCreateAccountEntry() {
  installGlassPlaqueNode();

  installFaceOne();

  installSwipeCue();

  installTurnAudioListener();

  installGlassPlaqueTwoNode();

  installGlassPlaqueThreeNode();

  installEmailSendSurface();

  installEntryBridge();

  openHumanVerifyCrossing();

  installSequenceOneRelease();

  installSequenceTwo();

  installSequenceTwoRelease();

  installFaceTurn();

  window.addEventListener(
    "cybercrowd:movement-one-landed",
    openTurnstileOne,
    { once: true }
  );

  window.addEventListener(
    "cybercrowd:turnstile-two-requested",
    openTurnstileTwo,
    { once: true }
  );

  installPlacardSwipe();
}

startCreateAccountEntry();
