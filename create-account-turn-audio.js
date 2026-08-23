// CYBERCROWD
//
// REPO: cybercrowd99/cybercrowd-net
// PATH: create-account-turn-audio.js
//
// BUILD LAW:
// 1 FILE
// 1 JOB
// 1 FUNCTION
//
// JOB:
// Own the Create Account cylinder-turn audio cue.
//
// FUNCTION:
// playTurnAudio()
//
// BEHAVIOR SOURCE:
// Proven create-account.js reference.
//
// OWNS:
// 0.09-second mechanical turn sound.
// AudioContext creation/resume.
// Oscillator frequency drop.
// Gain decay.
//
// DOES NOT OWN:
// Swipe.
// Cylinder geometry.
// Cylinder position.
// Animation.
// Turnstile.
// Email.
// Send.
// WHOOSH.
// Authentication.
// Routing.

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

    if (audioContext.state === "suspended") {
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

    oscillator.frequency.setValueAtTime(
      840,
      now
    );

    oscillator.frequency.exponentialRampToValueAtTime(
      120,
      now + duration
    );

    gain.gain.setValueAtTime(
      0.22,
      now
    );

    gain.gain.exponentialRampToValueAtTime(
      0.001,
      now + duration
    );

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start(now);
    oscillator.stop(now + duration);

    return true;
  } catch (_) {
    return false;
  }
}
