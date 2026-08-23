// CYBERCROWD
//
// REPO: cybercrowd99/cybercrowd-net
// PATH: create-account-turn-audio-listener.js
//
// BUILD LAW:
// 1 FILE
// 1 JOB
// 1 FUNCTION
//
// JOB:
// Listen for the cylinder-turn signal
// and trigger the existing Create Account turn-audio owner.
//
// FUNCTION:
// installTurnAudioListener()
//
// SIGNAL:
// cybercrowd:cylinder-turned
//
// POINTS TO:
// create-account-turn-audio.js
//
// DOES NOT OWN:
// Swipe.
// Cylinder geometry.
// Cylinder position.
// Turn timing.
// Audio generation math.
// Turnstile.
// Email.
// Send.
// WHOOSH.
// Authentication.
// Routing.

import {
  playTurnAudio
} from "./create-account-turn-audio.js";

export function installTurnAudioListener() {
  window.addEventListener(
    "cybercrowd:cylinder-turned",
    playTurnAudio
  );
}
