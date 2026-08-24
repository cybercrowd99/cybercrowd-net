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
// Play Sequence #1
// Surface Closing audio.
//
// FUNCTION:
// playTurnAudio()
//
// SOURCE:
// cybercrowd-net Pages Function
// ↓
// private SOUND_EFFECTS R2
// ↓
// Surface-closing_1sEffect.mp3
//
// NO OSCILLATOR.
// NO SYNTHESIS.
// NO TIMER.
// NO MOVEMENT OWNERSHIP.

const turnAudio =
  new Audio(
    "/api/r2-sound-effect"
  );

turnAudio.preload =
  "auto";

turnAudio.setAttribute(
  "playsinline",
  ""
);

turnAudio.setAttribute(
  "webkit-playsinline",
  ""
);

export async function playTurnAudio() {
  try {
    turnAudio.muted =
      false;

    turnAudio.volume =
      1;

    if (
      turnAudio.readyState === 0
    ) {
      turnAudio.load();
    }

    try {
      turnAudio.currentTime =
        0;
    } catch (_) {}

    await turnAudio.play();

    return true;

  } catch (error) {
    console.error(
      "CyberCrowd Sequence #1 audio failed:",
      error
    );

    return false;
  }
}
