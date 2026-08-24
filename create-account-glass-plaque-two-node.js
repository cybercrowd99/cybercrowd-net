
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
// CURRENT TEST:
//
// Sequence #1
// ↓
// human swipe
// ↓
// Slam #1 + Movement #1
// ↓
// Sequence #1 transform lands
// ↓
// Sequence #2 clear glass created
// ↓
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
  installTurnAudioListener
} from "./create-account-turn-audio-listener.js";

import {
  installGlassPlaqueTwoNode
} from "./create-account-glass-plaque-two-node.js";

import {
  installPlacardSwipe
} from "./placard-swipe.js";

function startCreateAccountEntry() {
  installGlassPlaqueNode();

  installFaceOne();

  installSwipeCue();

  installTurnAudioListener();

  installGlassPlaqueTwoNode();

  installPlacardSwipe();
}

startCreateAccountEntry();
