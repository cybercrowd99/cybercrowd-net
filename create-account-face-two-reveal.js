// CYBERCROWD
//
// REPO: cybercrowd99/cybercrowd-net
// PATH: create-account-face-two-reveal.js
//
// BUILD LAW:
// 1 FILE
// 1 JOB
// 1 FUNCTION
//
// JOB:
// Publish the Create Account face-two content reveal
// only after the 180-degree plaque turn has completed.
//
// FUNCTION:
// installFaceTwoReveal()
//
// INPUT:
// cybercrowd:face-two-arrived
//
// OUTPUT:
// cybercrowd:face-two-reveal
//
// FLOW:
// FACE 1
// → VERIFIED HUMAN
// → 180° TURN
// → FACE 2 ARRIVES
// → FACE 2 REVEAL
//
// DOES NOT OWN:
// Plaque movement.
// Turn timing.
// Turn audio.
// Face-two content.
// Email.
// Send.
// Turnstile.
// Human verification.
// WHOOSH.
// Authentication.
// Session.
// Routing.

export function installFaceTwoReveal() {
  let revealed = false;

  window.addEventListener(
    "cybercrowd:face-two-arrived",
    () => {
      if (revealed) {
        return;
      }

      revealed = true;

      window.dispatchEvent(
        new CustomEvent(
          "cybercrowd:face-two-reveal"
        )
      );
    }
  );
}
