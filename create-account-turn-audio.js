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
// SOURCE:
// Cloudflare R2
// sound-effects/Surface-closing_1sEffect.mp3

const TURN_AUDIO_URL =
https://b15830fa5a72b2e179236cb740dd762d.r2.cloudflarestorage.com/sound-effects/Surface-closing_1sEffect.mp3";

const turnAudio =
  new Audio(TURN_AUDIO_URL);

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
