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
// surface-closing sound.
//
// FUNCTION:
// playTurnAudio()
//
// AUDIO CALL LAW:
// unmute
// full volume
// load if needed
// rewind
// play
//
// NO OSCILLATOR.
// NO SYNTHESIS.
// NO TIMER.
// NO MOVEMENT OWNERSHIP.

const turnAudio =
  new Audio();

turnAudio.preload = "auto";
turnAudio.playsInline = true;

turnAudio.src =
  "/api/r2-sound-effect/Surface-closing_1sEffect.mp3";

export async function playTurnAudio() {
  try {
    turnAudio.muted = false;
    turnAudio.volume = 1;

    turnAudio.setAttribute(
      "playsinline",
      ""
    );

    turnAudio.setAttribute(
      "webkit-playsinline",
      ""
    );

    if (
      turnAudio.readyState === 0
    ) {
      turnAudio.load();
    }

    try {
      turnAudio.currentTime = 0;
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
