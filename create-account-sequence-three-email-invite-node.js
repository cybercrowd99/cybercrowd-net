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
// Mount the empty ENTER EMAIL invitation node
// inside the existing Sequence #3 plaque.
//
// FUNCTION:
// installSequenceThreeEmailInviteNode()
//
// INPUT:
// cybercrowd:face-two-arrived
//
// OUTPUT:
// #email-invite
//
// PARENT:
// .glass-plaque-three
//
// DOES NOT OWN:
// Image presentation.
// Human click.
// Movement #3.
// Sequence #4.
// Email input.
// SEND.
// Turnstile.
// Verification.
// Rotation.
// Audio.
// WHOOSH.
// Authentication.
// Session.
// Routing.
// Backend authority.
//

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

      const emailInvite =
        document.createElement(
          "button"
        );

      emailInvite.id =
        "email-invite";

      emailInvite.type =
        "button";

      emailInvite.setAttribute(
        "aria-label",
        "Enter your email here"
      );

      plaque.appendChild(
        emailInvite
      );
    },
    { once: true }
  );

  return true;
}
