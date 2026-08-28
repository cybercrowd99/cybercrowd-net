// CYBERCROWD
//
// REPO:
// cybercrowd99/cybercrowd-net
//
// LANE:
// PUBLIC NET
//
// FILE:
// create-account-sequence-four-email-open-state.js
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
// Apply the Email open-state marker
// to the real Sequence #4 Email input.
//
// FUNCTION:
// installSequenceFourEmailOpenState()
//
// INPUT:
// cybercrowd:email-opened
//
// OUTPUT:
// .email-field.is-open
// inside .glass-plaque-four.
//
// DOES NOT OWN:
// Raw human focus.
// Email-opened publication.
// Email node creation.
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

export function installSequenceFourEmailOpenState() {
  let opened =
    false;

  window.addEventListener(
    "cybercrowd:email-opened",
    () => {
      if (opened) {
        return;
      }

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

      opened =
        true;

      email.classList.add(
        "is-open"
      );
    }
  );

  return true;
}
