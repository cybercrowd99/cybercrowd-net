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
  "https://pub-660d879738134ba990d1708d015ec763.r2.dev/sound-effects/Surface-closing_1sEffect.mp3";

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
