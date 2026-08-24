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
// Run Sequence #2 after the existing
// verified Turnstile handoff.
//
// FUNCTION:
// installSequenceTwo()
//
// INPUT:
// cybercrowd:turnstile-one-verified
//
// OUTPUT:
// Slam #2
// Movement #2
// cybercrowd:face-two-arrived
//
// POSITION:
// 90° → 180°
//
// DOES NOT OWN:
// Sequence #1.
// Turnstile rendering.
// Turnstile token.
// Human verification.
// Backend.
// Sequence #3.

import {
  playSequenceTwoAudio
} from "./create-account-sequence-two-audio.js";

export function installSequenceTwo() {
  const MOVEMENT_TWO_START =
    Math.PI / 2;

  const MOVEMENT_TWO_DESTINATION =
    Math.PI;

  const TURN_DURATION =
    90;

  let completed =
    false;

  window.addEventListener(
    "cybercrowd:turnstile-one-verified",
    async () => {
      if (completed) {
        return;
      }

      completed =
        true;

      playSequenceTwoAudio();

      document.documentElement.style.setProperty(
        "--cylinder-angle",
        `${MOVEMENT_TWO_DESTINATION}rad`
      );

      window.setTimeout(
        () => {
          window.dispatchEvent(
            new CustomEvent(
              "cybercrowd:face-two-arrived",
              {
                detail: {
                  movement: 2,
                  from: MOVEMENT_TWO_START,
                  to: MOVEMENT_TWO_DESTINATION,
                  degreesMoved: 90,
                  destinationDegrees: 180,
                  duration: TURN_DURATION
                }
              }
            )
          );
        },
        TURN_DURATION
      );
    }
  );
}
