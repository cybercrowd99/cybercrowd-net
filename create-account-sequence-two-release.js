// CYBERCROWD
//
// FILE:
// create-account-sequence-two-release.js
//
// BUILD LAW:
// 1 FILE
// 1 JOB
// 1 FUNCTION
//
// SEQUENCE:
// #2
//
// JOB:
// Release Sequence #2 human-touch ownership
// after Movement #2 has completed.
//
// FUNCTION:
// installSequenceTwoRelease()
//
// INPUT:
// cybercrowd:face-two-arrived
//
// ACTION:
// Remove .is-active from .glass-plaque-two.
//
// RESULT:
// Sequence #2 returns to pointer-events: none.
// Sequence #3 receives human touch.
//
// DOES NOT OWN:
// Turnstile #1.
// Turnstile verification.
// Movement.
// Email.
// SEND.
// Turnstile #2.
// WHOOSH.
// Authentication.
// Routing.
// Backend authority.

export function installSequenceTwoRelease() {
  let released = false;

  window.addEventListener(
    "cybercrowd:face-two-arrived",
    () => {
      if (released) {
        return;
      }

      released = true;

      const plaque =
        document.querySelector(
          ".glass-plaque-two"
        );

      if (!plaque) {
        return;
      }

      plaque.classList.remove(
        "is-active"
      );
    },
    { once: true }
  );

  return true;
}
