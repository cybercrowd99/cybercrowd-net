// CYBERCROWD
// 
// FILE:
// create-account-sequence-two.js
//
// BUILD LAW:
// 1 FILE
// 1 JOB
// 1 FUNCTION
//
// JOB:
// Wake Sequence #2 audio from the same
// Turnstile success strike that starts Movement #2.
//
// FUNCTION:
// installSequenceTwo()
//
// INPUT:
// cybercrowd:human-passed
//
// OUTPUT:
// Sequence #2 slam audio starts.
//
// DOES NOT OWN:
// Movement #2.
// Turnstile rendering.
// Turnstile verification.
// Authentication.
// Email.
// Routing.

import {
  playSequenceTwoAudio
} from "./create-account-sequence-two-audio.js";

export function installSequenceTwo() {
  window.addEventListener(
    "cybercrowd:human-passed",
    () => {
      playSequenceTwoAudio();
    },
    { once: true }
  );
}
