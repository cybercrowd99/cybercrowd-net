// CYBERCROWD
//
// FILE:
// create-account-glass-plaque-node.js
//
// BUILD LAW:
// 1 FILE
// 1 JOB
// 1 FUNCTION
//
// JOB:
// Create the single Sequence #1 glass plaque node.
//
// FUNCTION:
// installGlassPlaqueNode()

export function installGlassPlaqueNode() {
  const stage =
    document.querySelector(".stage");

  if (!stage) {
    return false;
  }

  let plaque =
    stage.querySelector(
      ":scope > .glass-plaque"
    );

  if (!plaque) {
    plaque =
      document.createElement("section");

    plaque.className =
      "glass-plaque";

    plaque.setAttribute(
      "aria-label",
      "CyberCrowd Create Account"
    );

    stage.appendChild(plaque);
  }

  return true;
}
