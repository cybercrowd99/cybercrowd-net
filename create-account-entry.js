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
// Sequence #2
// ↓
// Turnstile Widget #1
// ↓
// cybercrowd:human-passed
// ↓
// automatic Movement #2
// ↓
// 90° → 180°
// ↓
// Sequence #3
// ↓
// ENTER EMAIL invitation
// ↓
// human touch
// ↓
// cybercrowd:movement-three-requested
// ↓
// Movement #3
// ↓
// 180° → 270°
// ↓
// cybercrowd:face-three-arrived
// ↓
// Sequence #4
// ↓
// real Email input
// ↓
// SEND
// ↓
// cybercrowd:send-business-entered
// ↓
// cybercrowd:turnstile-two-requested
//
// SEVERED:
// create-account-email-send-surface.js
// is no longer installed by this entry.
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
  installSequenceThreeEmailInviteNode
} from "./create-account-sequence-three-email-invite-node.js";

import {
  installSequenceThreeEmailInviteTouch
} from "./create-account-sequence-three-email-invite-touch.js";

import {
  installGlassPlaqueFourNode
} from "./create-account-glass-plaque-four-node.js";

import {
  installSequenceFourInstructionsNode
} from "./create-account-sequence-four-instructions-node.js";

import {
  installSequenceFourEmailInputNode
} from "./create-account-sequence-four-email-input-node.js";

import {
  installSequenceFourEmailOpen
} from "./create-account-sequence-four-email-open.js";

import {
  installSequenceFourEmailOpenState
} from "./create-account-sequence-four-email-open-state.js";

import {
  installSequenceFourSendButtonNode
} from "./create-account-sequence-four-send-button-node.js";

import {
  installSequenceFourEmailReadiness
} from "./create-account-sequence-four-email-readiness.js";

import {
  installSequenceFourSendReadiness
} from "./create-account-sequence-four-send-readiness.js";

import {
  installSequenceFourSendBusinessEntry
} from "./create-account-sequence-four-send-business-entry.js";

import {
  installSequenceFourSendBusinessReceiver
} from "./create-account-sequence-four-send-business-receiver.js";

import {
  installSequenceFourMailBridgeIn
} from "./create-account-sequence-four-mail-bridge-in.js";

import {
  installSequenceFourMailOrderValidator
} from "./create-account-sequence-four-mail-order-validator.js";

import {
  installSequenceFourMailRequest
} from "./create-account-sequence-four-mail-request.js";

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
  installTurnstileTwoPassReceiver
} from "./turnstile-two-pass-receiver.js";

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
  installFaceTurnThree
} from "./create-account-face-turn-three.js";

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

  installSequenceThreeEmailInviteNode();

  installSequenceThreeEmailInviteTouch();

  installGlassPlaqueFourNode();

  installSequenceFourInstructionsNode();

  installSequenceFourEmailInputNode();

  installSequenceFourSendButtonNode();

  installSequenceFourEmailOpenState();

  installSequenceFourSendReadiness();

  installSequenceFourEmailOpen();

  installSequenceFourEmailReadiness();

  installSequenceFourSendBusinessEntry();

  installSequenceFourSendBusinessReceiver();

  installSequenceFourMailBridgeIn();

  installSequenceFourMailOrderValidator();

  installSequenceFourMailRequest();

  installEntryBridge();

  openHumanVerifyCrossing();

  installTurnstileTwoPassReceiver();

  installSequenceOneRelease();

  installSequenceTwo();

  installSequenceTwoRelease();

  installFaceTurn();

  installFaceTurnThree();

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
