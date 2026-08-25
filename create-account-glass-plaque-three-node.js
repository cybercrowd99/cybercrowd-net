// CYBERCROWD
//
// FILE:
// create-account-glass-plaque-three-node.js
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
// Mount the empty Sequence #3 glass plaque
// only after Sequence #2 arrives.
//
// FUNCTION:
// installGlassPlaqueThreeNode()
//
// INPUT:
// cybercrowd:face-two-arrived
//
// OUTPUT:
// .glass-plaque-three
//
// DOES NOT OWN:
// Sequence #1.
// Sequence #2.
// Email entry.
// Email input.
// Send button.
// Turnstile.
// Verification.
// Movement.
// Rotation.
// Audio.
// WHOOSH.
// Authentication.
// Session.
// Routing.

export function installGlassPlaqueThreeNode() {
  const stage =
    document.querySelector(".stage");

  if (!stage) {
    return false;
  }

  window.addEventListener(
    "cybercrowd:face-two-arrived",
    () => {
      let plaque =
        stage.querySelector(
          ":scope > .glass-plaque-three"
        );

      if (plaque) {
        return;
      }

      plaque =
        document.createElement("section");

      plaque.className =
        "glass-plaque-three";

      plaque.setAttribute(
        "aria-label",
        "CyberCrowd Sequence Three"
      );

      stage.appendChild(plaque);
    },
    { once: true }
  );

  return true;
}
