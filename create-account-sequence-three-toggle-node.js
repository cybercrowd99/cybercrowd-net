// CYBERCROWD
//
// FILE:
// create-account-sequence-three-toggle-node.js
//
// BUILD LAW:
// 1 FILE
// 1 JOB
// 1 FUNCTION
//
// SEQUENCE:
// #3
//
// JOB:
// Mount the Window #3 toggle node.
//
// FUNCTION:
// installSequenceThreeToggleNode()
//
// INPUT:
// cybercrowd:face-two-arrived
//
// OUTPUT:
// #sequence-three-toggle
//
// ACTUAL END:
// Toggle node mounted.
// CLOSED.
//
// DOES NOT OWN:
// Visible label meaning.
// Human touch.
// Movement.
// Rotation.
// Sequence #4.
// Turnstile.
// Verification.
// Audio.
// WHOOSH.
// Authentication.
// Session.
// Routing.
// Backend authority.

export function installSequenceThreeToggleNode() {
  window.addEventListener(
    "cybercrowd:face-two-arrived",
    () => {
      const plaque =
        document.querySelector(
          ".glass-plaque-three"
        );

      if (!plaque) {
        return;
      }

      if (
        document.getElementById(
          "sequence-three-toggle"
        )
      ) {
        return;
      }

      const toggle =
        document.createElement(
          "button"
        );

      toggle.id =
        "sequence-three-toggle";

      toggle.type =
        "button";

      plaque.appendChild(
        toggle
      );
    },
    { once: true }
  );

  return true;
}
