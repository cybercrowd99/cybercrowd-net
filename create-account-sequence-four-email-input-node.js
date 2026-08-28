// CYBERCROWD
//
// REPO:
// cybercrowd99/cybercrowd-net
//
// LANE:
// PUBLIC NET
//
// FILE:
// create-account-sequence-four-email-input-node.js
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
// Mount the real empty Email input
// directly onto the existing Sequence #4 plaque.
//
// FUNCTION:
// installSequenceFourEmailInputNode()
//
// INPUT:
// cybercrowd:face-three-arrived
//
// OUTPUT:
// #email
//
// PARENT:
// .glass-plaque-four
//
// DOES NOT OWN:
// Sequence #3.
// ENTER EMAIL invitation.
// Email presentation.
// Email focus.
// Email opening.
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

export function installSequenceFourEmailInputNode() {
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

      if (
        document.getElementById(
          "email"
        )
      ) {
        return;
      }

      const email =
        document.createElement(
          "input"
        );

      email.id =
        "email";

      email.className =
        "email-field";

      email.type =
        "email";

      email.name =
        "email";

      email.inputMode =
        "email";

      email.autocomplete =
        "email";

      email.autocapitalize =
        "none";

      email.spellcheck =
        false;

      email.setAttribute(
        "aria-label",
        "Enter your email here"
      );

      plaque.appendChild(
        email
      );
    },
    { once: true }
  );

  return true;
}
