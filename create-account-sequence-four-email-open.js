// CYBERCROWD
//
// REPO:
// cybercrowd99/cybercrowd-net
//
// LANE:
// PUBLIC NET
//
// FILE:
// create-account-sequence-four-email-open.js
//
// BUILD LAW:
// 1 FILE
// 1 JOB
// 1 FUNCTION
//
// SEQUENCE:
// #4
//
// JOB:
// Open and focus the real Sequence #4
// Email input when Window #4 arrives.
//
// FUNCTION:
// installSequenceFourEmailOpen()
//
// INPUT:
// cybercrowd:face-three-arrived
//
// OUTPUT:
// cybercrowd:email-opened
//
// DOES NOT OWN:
// Email node creation.
// Email presentation.
// Open-state presentation.
// Email typing.
// Email validation.
// SEND.
// Turnstile.
// Verification.
// Movement.
// Rotation.
// Audio.
// WHOOSH.
// Transmission.
// Authentication.
// Session.
// Routing.
// Backend authority.
// Old-limb removal.

export function installSequenceFourEmailOpen() {
  window.addEventListener(
    "cybercrowd:face-three-arrived",
    () => {
      const plaque =
        document.querySelector(
          ".glass-plaque-four"
        );

      if (!plaque) {
        return;
      }

      const email =
        plaque.querySelector(
          ":scope > .email-field"
        );

      if (!email) {
        return;
      }

      window.dispatchEvent(
        new CustomEvent(
          "cybercrowd:email-opened"
        )
      );

      email.focus({
        preventScroll: true
      });
    },
    { once: true }
  );

  return true;
}
