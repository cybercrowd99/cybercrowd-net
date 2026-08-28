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
// Own the first focus
// on the real Sequence #4 Email input.
//
// FUNCTION:
// installSequenceFourEmailOpen()
//
// INPUT:
// First focus on the direct .email-field
// inside .glass-plaque-four.
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

      email.addEventListener(
        "focus",
        () => {
          window.dispatchEvent(
            new CustomEvent(
              "cybercrowd:email-opened"
            )
          );
        },
        { once: true }
      );
    },
    { once: true }
  );

  return true;
}
