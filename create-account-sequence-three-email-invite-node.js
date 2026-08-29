// CYBERCROWD
//
// REPO:
// cybercrowd99/cybercrowd-net
//
// LANE:
// PUBLIC NET
//
// FILE:
// create-account-sequence-three-email-invite-node.js
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
// Mount one clickable entry image
// on Sequence #3.
//
// FUNCTION:
// installSequenceThreeEmailInviteNode()
//
// INPUT:
// cybercrowd:face-two-arrived
//
// HUMAN:
// touch or mouse click
//
// OUTPUT:
// cybercrowd:movement-three-requested
//
// DOES NOT OWN:
// Email input.
// SEND.
// Sequence #4.
// Rotation.
// Authentication.
// Backend authority.

export function installSequenceThreeEmailInviteNode() {
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
          "email-invite"
        )
      ) {
        return;
      }

      const entryButton =
        document.createElement(
          "button"
        );

      entryButton.id =
        "email-invite";

      entryButton.type =
        "button";

      entryButton.setAttribute(
        "aria-label",
        "Click here to enter"
      );

      entryButton.addEventListener(
        "click",
        () => {
          window.dispatchEvent(
            new CustomEvent(
              "cybercrowd:movement-three-requested"
            )
          );
        },
        { once: true }
      );

      plaque.appendChild(
        entryButton
      );
    },
    { once: true }
  );

  return true;
}
