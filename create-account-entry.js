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
  openTurnstileOne
} from "./turnstile-one-ui.js";

import {
  installSequenceOneRelease
} from "./create-account-sequence-one-release.js";

import {
  installPlacardSwipe
} from "./placard-swipe.js";

import {
  installGlassPlaqueTwoNode
} from "./create-account-glass-plaque-two-node.js";

import {
  openHumanVerifyCrossing
} from "./human-verify-crossing.js";

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
  installGlassPlaqueThreeNode
} from "./create-account-glass-plaque-three-node.js";

import {
  installSequenceThreeEmailInviteNode
} from "./create-account-sequence-three-email-invite-node.js";

import {
  installSequenceThreeEmailInviteTouch
} from "./create-account-sequence-three-email-invite-touch.js";

import {
  installFaceTurnThree
} from "./create-account-face-turn-three.js";

import {
  installGlassPlaqueFourNode
} from "./create-account-glass-plaque-four-node.js";

function startCreateAccountEntry() {
  installGlassPlaqueNode();

  installFaceOne();

  installSwipeCue();

  installTurnAudioListener();

  openHumanVerifyCrossing();

  installSequenceOneRelease();

  installPlacardSwipe();

  installGlassPlaqueTwoNode();

  installSequenceTwo();

  installSequenceTwoRelease();

  installFaceTurn();

  installGlassPlaqueThreeNode();

  installSequenceThreeEmailInviteNode();

  installSequenceThreeEmailInviteTouch();

  installFaceTurnThree();

  installGlassPlaqueFourNode();

  window.addEventListener(
    "cybercrowd:movement-one-landed",
    openTurnstileOne,
    { once: true }
  );
}

startCreateAccountEntry();
