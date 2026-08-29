// CYBERCROWD
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
// 3
//
// JOB:
// Own one human touch on the existing
// ENTER EMAIL invitation.
//
// FUNCTION:
// installSequenceThreeEmailInviteTouch()
//
// INPUT:
// Human click on email-invite.
//
// OUTPUT:
// cybercrowd:movement-three-requested
//
// ACTUAL END:
// Movement request emitted.
// Click listener removed.
// CLOSED.
//
// DOES NOT OWN:
// Invitation node creation.
// Image presentation.
// Movement 3.
// Rotation.
// Sequence 4.
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
  function handleInviteTouch(event) {
    const emailInvite =
      event.target.closest('[id="email-invite"]');

    if (!emailInvite) {
      return;
    }

    document.removeEventListener("click", handleInviteTouch);

    window.dispatchEvent(
      new CustomEvent("cybercrowd:movement-three-requested")
    );
  }

  document.addEventListener("click", handleInviteTouch);

  return true;
}
