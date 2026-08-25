// LABEL: 2
//
// CYBERCROWD
//
// REPO: cybercrowd99/cybercrowd-net
// PATH: create-account-glass-plaque-node.js
//
// BUILD LAW:
// 1 FILE
// 1 JOB
// 1 FUNCTION
//
// JOB:
// Create the single Create Account glass-plaque organism node.
//
// FUNCTION:
// installGlassPlaqueNode()
//
// OWNS:
// .glass-plaque runtime node.
// Physical parent boundary for Create Account interface children.
// Adoption of existing direct stage children.
//
// DOES NOT OWN:
// Child behavior.
// Seal presentation.
// Title presentation.
// Welcome presentation.
// Email presentation.
// Send behavior.
// Turnstile behavior.
// Wheel movement.
// Cylinder geometry.
// Audio.
// Authentication.
// Session.
// Routing.
// Backend authority.

export function installGlassPlaqueNode() {
  const stage =
    document.querySelector(".stage");

  if (!stage) {
    return false;
  }

  let plaque =
    stage.querySelector(":scope > .glass-plaque");

  if (!plaque) {
    plaque =
      document.createElement("section");

    plaque.className =
      "glass-plaque";

    plaque.setAttribute(
      "aria-label",
      "CyberCrowd Create Account"
    );

    const existingChildren =
      Array.from(stage.children);

    stage.appendChild(plaque);

    for (const child of existingChildren) {
      plaque.appendChild(child);
    }
  }

  return true;
}
