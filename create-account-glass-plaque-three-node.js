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
// onto the existing Create Account rail.
//
// FUNCTION:
// installGlassPlaqueThreeNode()
//
// OUTPUT:
// .glass-plaque-three
//
// DOES NOT OWN:
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

  let plaque =
    stage.querySelector(
      ":scope > .glass-plaque-three"
    );

  if (plaque) {
    return true;
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

  return true;
}
