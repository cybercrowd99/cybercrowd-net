// CYBERCROWD
//
// REPO:
// cybercrowd99/cybercrowd-net
//
// LANE:
// PUBLIC NET
//
// FILE:
// create-account-sequence-four-instructions-node.js
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
// Mount the approved Email + SEND instructions
// directly onto the existing Sequence #4 plaque.
//
// FUNCTION:
// installSequenceFourInstructionsNode()
//
// INPUT:
// cybercrowd:face-three-arrived
//
// OUTPUT:
// .email-send-instructions
//
// PARENT:
// .glass-plaque-four
//
// DOES NOT OWN:
// Instructions presentation.
// Email node creation.
// Email presentation.
// Email opening.
// Email readiness.
// SEND node creation.
// SEND presentation.
// SEND readiness.
// SEND click.
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

export function installSequenceFourInstructionsNode() {
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
        plaque.querySelector(
          ":scope > .email-send-instructions"
        )
      ) {
        return;
      }

      const instructions =
        document.createElement(
          "div"
        );

      instructions.className =
        "email-send-instructions";

      instructions.innerHTML =
        "Enter your email.<br>" +
        "Press SEND.<br>" +
        "Check your email right away.<br>" +
        "You must verify within five minutes.<br>" +
        "If you wait too long, it will <strong>EXPIRE</strong>.";

      plaque.appendChild(
        instructions
      );
    },
    { once: true }
  );

  return true;
}
