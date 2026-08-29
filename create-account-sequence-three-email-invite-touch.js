// CYBERCROWD
//
// REPO:
// cybercrowd99/cybercrowd-net
//
// LANE:
// PUBLIC NET
//
// FILE:
// create-account-sequence-three-email-invite-touch.js
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
// Own the first human touch
// on the existing ENTER EMAIL invitation.
//
// FUNCTION:
// installSequenceThreeEmailInviteTouch()
//
// INPUT:
// First click on #email-invite.
//
// OUTPUT:
// cybercrowd:movement-three-requested
//
// DOES NOT OWN:
// Invitation node creation.
// Image presentation.
// Movement #3.
// Rotation.
// Sequence #4.
// Email input.
// SEND.
// Turnstile.
// Verification.
// Audio.
// WHOOSH.
// Authentication.
// Session.
// Routing.
// Backend authority.

export function installSequenceThreeEmailInviteTouch() {
  let requested =
    false;

  window.addEventListener(
    "cybercrowd:face-two-arrived",
    () => {
      const emailInvite =
        document.getElementById(
          "email-invite"
        );

      if (!emailInvite) {
        return;
      }

      emailInvite.addEventListener(
        "click",
        () => {
          if (requested) {
            return;
          }

          requested =
            true;

          window.dispatchEvent(
            new CustomEvent(
              "cybercrowd:movement-three-requested"
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
