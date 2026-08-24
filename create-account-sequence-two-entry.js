// CYBERCROWD
//
// FILE:
// create-account-sequence-two-entry.js
//
// JOB:
// Connect Sequence #2.
//
// FUNCTION:
// startSequenceTwo()

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
} from "./create-account-face-turn-v2.js";

export function startSequenceTwo() {
  openHumanVerifyCrossing();
  installSequenceTwo();
  installFaceTurn();

  window.addEventListener(
    "cybercrowd:your-turn",
    () => {
      openTurnstileOne();
    },
    { once: true }
  );
}

startSequenceTwo();
