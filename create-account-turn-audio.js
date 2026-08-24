// CYBERCROWD
//
// FILE:
// create-account-turn-audio.js
//
// BUILD LAW:
// 1 FILE
// 1 JOB
// 1 FUNCTION
//
// JOB:
// Play the existing Sequence #1
// Surface Closing sound.
//
// FUNCTION:
// playTurnAudio()
//
// OBJECT:
// Surface-closing_1sEffect.mp3
//
// NO OSCILLATOR.
// NO SYNTHESIS.
// NO TIMER.
// NO MOVEMENT OWNERSHIP.

const turnAudio =
  new Audio(
    "/sound-effects/Surface-closing_1sEffect.mp3"
  );

turnAudio.preload = "auto";
turnAudio.playsInline = true;

export function playTurnAudio() {
  try {
    turnAudio.currentTime = 0;

    const playRequest =
      turnAudio.play();

    if (
      playRequest &&
      typeof playRequest.catch === "function"
    ) {
      playRequest.catch(() => {});
    }

    return true;
  } catch (_) {
    return false;
  }
}
