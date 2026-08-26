// CYBERCROWD
//
// FILE:
// create-account-sequence-one-release.js
//
// BUILD LAW:
// 1 FILE
// 1 JOB
// 1 FUNCTION
//
// SEQUENCE:
// #1
//
// JOB:
// Close Sequence #1 human-touch ownership
// after Movement #1 has completed.
//
// FUNCTION:
// installSequenceOneRelease()
//
// INPUT:
// cybercrowd:movement-one-landed
//
// ACTION:
// Release .glass-plaque human touch.
//
// RESULT:
// Sequence #1 is closed.
// Later sequences receive human touch.
//
// DOES NOT OWN:
// Movement #1.
// Movement #2.
// Turnstile.
// Verification.
// Email.
// SEND.
// Audio.
// WHOOSH.
// Authentication.
// Session.
// Routing.
// Backend authority.

export function installSequenceOneRelease() {
  let released =
    false;

  window.addEventListener(
    "cybercrowd:movement-one-landed",
    () => {
      if (released) {
        return;
      }

      const plaque =
        document.querySelector(
          ".glass-plaque"
        );

      if (!plaque) {
        return;
      }

      released =
        true;

      plaque.style.pointerEvents =
        "none";

      plaque.style.touchAction =
        "auto";
    },
    { once: true }
  );

  return true;
}
