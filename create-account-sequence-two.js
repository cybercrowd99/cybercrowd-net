// CYBERCROWD
//
// FILE:
// create-account-sequence-two.js
//
// JOB:
// Wake Sequence #2 from the real
// verified Turnstile signal.
//
// FUNCTION:
// installSequenceTwo()

import {
  playSequenceTwoAudio
} from "./create-account-sequence-two-audio.js";

export function installSequenceTwo() {
  window.addEventListener(
    "cybercrowd:turnstile-one-verified",
    () => {
      playSequenceTwoAudio();
    },
    { once: true }
  );
}
