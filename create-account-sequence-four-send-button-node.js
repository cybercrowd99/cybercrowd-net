// CYBERCROWD
//
// REPO:
// cybercrowd99/cybercrowd-net
//
// LANE:
// PUBLIC NET
//
// FILE:
// create-account-sequence-four-send-button-node.js
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
// Mount the real SEND button
// directly onto the existing Sequence #4 plaque.
//
// FUNCTION:
// installSequenceFourSendButtonNode()
//
// INPUT:
// cybercrowd:face-three-arrived
//
// OUTPUT:
// #sendButton
//
// INITIAL STATE:
// Native disabled.
//
// PARENT:
// .glass-plaque-four
//
// DOES NOT OWN:
// Sequence #3.
// SEND presentation.
// SEND readiness.
// SEND click.
// Email input.
// Email validation.
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

export function installSequenceFourSendButtonNode() {
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
          "sendButton"
        )
      ) {
        return;
      }

      const sendButton =
        document.createElement(
          "button"
        );

      sendButton.id =
        "sendButton";

      sendButton.type =
        "button";

      sendButton.disabled =
        true;

      sendButton.setAttribute(
        "aria-disabled",
        "true"
      );

      sendButton.setAttribute(
        "aria-label",
        "Send"
      );

      plaque.appendChild(
        sendButton
      );
    },
    { once: true }
  );

  return true;
}
