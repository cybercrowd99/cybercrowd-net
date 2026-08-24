// CYBERCROWD
//
// FILE:
// create-account-sequence-two-audio.js
//
// JOB:
// Play Slam #2.
//
// FUNCTION:
// playSequenceTwoAudio()

const audio =
  new Audio("/api/r2-sound-effect");

audio.preload = "auto";
audio.playsInline = true;
audio.volume = 1;

export async function playSequenceTwoAudio() {
  try {
    audio.currentTime = 0;
    await audio.play();
    return true;
  } catch (error) {
    console.error(
      "Sequence #2 audio failed:",
      error
    );
    return false;
  }
}
