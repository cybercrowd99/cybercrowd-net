// CYBERCROWD
//
// FILE:
// create-account-sequence-two-audio.js
//
// BUILD LAW:
// 1 FILE
// 1 JOB
// 1 FUNCTION
//
// JOB:
// Play Sequence #2 slam audio.
//
// FUNCTION:
// playSequenceTwoAudio()
//
// INPUT:
// Called only after
// cybercrowd:turnstile-one-verified
//
// SOURCE:
// existing Pages Function
// ↓
// private SOUND_EFFECTS R2
// ↓
// Surface-closing_1sEffect.mp3
//
// DOES NOT OWN:
// Sequence #1.
// Turnstile.
// Human verification.
// Movement.
// Backend.
// Routing.

const sequenceTwoAudio =
  new Audio(
    "/api/r2-sound-effect"
  );

sequenceTwoAudio.preload =
  "auto";

sequenceTwoAudio.setAttribute(
  "playsinline",
  ""
);

sequenceTwoAudio.setAttribute(
  "webkit-playsinline",
  ""
);

export async function playSequenceTwoAudio() {
  try {
    sequenceTwoAudio.muted =
      false;

    sequenceTwoAudio.volume =
      1;

    if (
      sequenceTwoAudio.readyState === 0
    ) {
      sequenceTwoAudio.load();
    }

    try {
      sequenceTwoAudio.currentTime =
        0;
    } catch (_) {}

    await sequenceTwoAudio.play();

    return true;

  } catch (error) {
    console.error(
      "CyberCrowd Sequence #2 audio failed:",
      error
    );

    return false;
  }
}
