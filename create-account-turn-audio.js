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
// Generate the Sequence #1
// matched mechanical slam.
//
// FUNCTION:
// playTurnAudio()
//
// MATCH:
// Movement #1 = 90ms
// Audio #1    = 90ms
//
// ONE MOVEMENT.
// ONE SLAM.

let audioContext = null;

export function playTurnAudio() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      window.webkitAudioContext;

    if (!AudioContextClass) {
      return false;
    }

    if (!audioContext) {
      audioContext =
        new AudioContextClass();
    }

    if (
      audioContext.state ===
      "suspended"
    ) {
      audioContext.resume();
    }

    const now =
      audioContext.currentTime;

    const duration =
      0.09;

    const oscillator =
      audioContext.createOscillator();

    const gain =
      audioContext.createGain();

    oscillator.type =
      "sine";

    oscillator.frequency
      .setValueAtTime(
        840,
        now
      );

    oscillator.frequency
      .exponentialRampToValueAtTime(
        120,
        now + duration
      );

    gain.gain
      .setValueAtTime(
        0.22,
        now
      );

    gain.gain
      .exponentialRampToValueAtTime(
        0.001,
        now + duration
      );

    oscillator.connect(
      gain
    );

    gain.connect(
      audioContext.destination
    );

    oscillator.start(
      now
    );

    oscillator.stop(
      now + duration
    );

    return true;

  } catch (_) {
    return false;
  }
}
