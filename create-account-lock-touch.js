// CYBERCROWD
//
// REPO: cybercrowd99/cybercrowd-net
// PATH: create-account-lock-touch.js
//
// BUILD LAW:
// 1 FILE
// 1 JOB
// 1 FUNCTION
//
// JOB:
// Provide the human-touch surface for the Create Account lock.
//
// FUNCTION:
// installLockTouch()
//
// SIGNAL:
// cybercrowd:entry-lock-touched
//
// OWNS:
// Real DOM touch target.
// Lock-touch click.
// Lock-touch signal publication.
//
// DOES NOT OWN:
// Seal image.
// Seal presentation.
// Turnstile.
// Human verification.
// Cylinder movement.
// Turn audio.
// Email.
// Send.
// Authentication.
// Routing.
// Backend authority.

export function installLockTouch() {
  const stage =
    document.querySelector(".stage");

  if (!stage) {
    return false;
  }

  let lockTouch =
    document.getElementById(
      "create-account-lock-touch"
    );

  if (!lockTouch) {
    lockTouch =
      document.createElement("button");

    lockTouch.id =
      "create-account-lock-touch";

    lockTouch.type =
      "button";

    lockTouch.setAttribute(
      "aria-label",
      "Begin human verification"
    );

    stage.appendChild(lockTouch);
  }

  lockTouch.addEventListener(
    "click",
    () => {
      window.dispatchEvent(
        new CustomEvent(
          "cybercrowd:entry-lock-touched"
        )
      );
    }
  );

  return true;
}
