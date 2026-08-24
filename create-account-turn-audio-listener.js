// CYBERCROWD
//
// FILE:
// create-account-turn-audio-listener.js
//
// BUILD LAW:
// 1 FILE
// 1 JOB
// 1 FUNCTION
//
// JOB:
// Connect Movement #1 start signal
// directly to its matched audio.
//
// FUNCTION:
// installTurnAudioListener()
//
// INPUT:
// cybercrowd:cylinder-turned
//
// OUTPUT:
// playTurnAudio()
//
// MATCH:
// Movement #1 = 90ms
// Audio #1    = 90ms
//
// ONE MOVEMENT.
// ONE SLAM.

import {
  playTurnAudio
} from "./create-account-turn-audio.js";

export function installTurnAudioListener() {
  window.addEventListener(
    "cybercrowd:cylinder-turned",
    playTurnAudio
  );

  return true;
}
