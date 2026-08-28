// CYBERCROWD
//
// REPO:
// cybercrowd99/cybercrowd-net
//
// LANE:
// PUBLIC NET
//
// FILE:
// create-account-sequence-four-send-readiness.js
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
// Apply the Email-readiness signal
// to the real Sequence #4 SEND button.
//
// FUNCTION:
// installSequenceFourSendReadiness()
//
// INPUT:
// cybercrowd:sequence-four-email-readiness
//
// OUTPUT:
// Native #sendButton enabled
// or disabled state.
//
// TRUE:
// disabled = false
//
// FALSE:
// disabled = true
//
// DOES NOT OWN:
// Email node creation.
// Email presentation.
// Email opening.
// Browser Email-readiness decision.
// SEND node creation.
// SEND presentation.
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

export function installSequenceFourSendReadiness() {
  window.addEventListener(
    "cybercrowd:sequence-four-email-readiness",
    (event) => {
      const plaque =
        document.querySelector(
          ".glass-plaque-four"
        );

      if (!plaque) {
        return;
      }

      const sendButton =
        plaque.querySelector(
          ":scope > #sendButton"
        );

      if (!sendButton) {
        return;
      }

      const ready =
        event?.detail?.ready ===
        true;

      sendButton.disabled =
        !ready;

      sendButton.setAttribute(
        "aria-disabled",
        ready
          ? "false"
          : "true"
      );
    }
  );

  return true;
}
