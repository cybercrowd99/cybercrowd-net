// CYBERCROWD
//
// REPO:
// cybercrowd99/cybercrowd-net
//
// LANE:
// PUBLIC NET
//
// FILE:
// create-account-sequence-four-email-readiness.js
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
// Convert native Sequence #4 Email input
// into one browser-readiness signal.
//
// FUNCTION:
// installSequenceFourEmailReadiness()
//
// INPUT:
// Native input event from the direct
// .email-field inside .glass-plaque-four.
//
// OUTPUT:
// cybercrowd:sequence-four-email-readiness
//
// PAYLOAD:
// ready
//
// READY:
// Non-empty Email value
// plus native browser Email validity.
//
// DOES NOT OWN:
// Email node creation.
// Email presentation.
// Email opening.
// SEND node creation.
// SEND enablement.
// SEND click.
// Private Email validation.
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

export function installSequenceFourEmailReadiness() {
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
        "input",
        () => {
          const ready =
            email.checkValidity() &&
            email.value.trim().length >
              0;

          window.dispatchEvent(
            new CustomEvent(
              "cybercrowd:sequence-four-email-readiness",
              {
                detail: {
                  ready
                }
              }
            )
          );
        }
      );
    },
    { once: true }
  );

  return true;
}
