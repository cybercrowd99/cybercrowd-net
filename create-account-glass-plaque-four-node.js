// CYBERCROWD
//
// REPO:
// cybercrowd99/cybercrowd-net
//
// LANE:
// PUBLIC NET
//
// FILE:
// create-account-glass-plaque-four-node.js
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
// Mount the empty Sequence #4 glass plaque
// only after Movement #3 has landed.
//
// FUNCTION:
// installGlassPlaqueFourNode()
//
// INPUT:
// cybercrowd:face-three-arrived
//
// OUTPUT:
// .glass-plaque-four
//
// DOES NOT OWN:
// Sequence #1.
// Sequence #2.
// Sequence #3.
// Email entry.
// Email input.
// SEND.
// Turnstile.
// Verification.
// Movement.
// Rotation.
// Audio.
// WHOOSH.
// Authentication.
// Session.
// Routing.
// Backend authority.

export function installGlassPlaqueFourNode() {
  const stage =
    document.querySelector(".stage");

  if (!stage) {
    return false;
  }

  window.addEventListener(
    "cybercrowd:face-three-arrived",
    () => {
      let plaque =
        stage.querySelector(
          ":scope > .glass-plaque-four"
        );

      if (plaque) {
        return;
      }

      plaque =
        document.createElement(
          "section"
        );

      plaque.className =
        "glass-plaque-four";

      plaque.setAttribute(
        "aria-label",
        "CyberCrowd Sequence Four"
      );

      stage.appendChild(
        plaque
      );
    },
    { once: true }
  );

  return true;
}
