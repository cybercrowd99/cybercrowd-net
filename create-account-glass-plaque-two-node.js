// CYBERCROWD
//
// FILE:
// create-account-glass-plaque-two-node.js
//
// BUILD LAW:
// 1 FILE
// 1 JOB
// 1 FUNCTION
//
// JOB:
// Create Sequence #2 clear glass
// only after Sequence #1 has landed.
//
// FUNCTION:
// installGlassPlaqueTwoNode()
//
// INPUT:
// cybercrowd:cylinder-turned
//
// WAIT:
// Sequence #1 real transform transitionend
//
// OUTPUT:
// .glass-plaque-two
//
// DOES NOT OWN:
// Turnstile.
// Audio.
// Verification.
// Movement #2.
// Email.
// Authentication.
// Routing.
// Backend authority.

export function installGlassPlaqueTwoNode() {
  const stage =
    document.querySelector(".stage");

  const faceOne =
    document.querySelector(".glass-plaque");

  if (!stage || !faceOne) {
    return false;
  }

  const createGlassTwo =
    () => {
      if (
        stage.querySelector(
          ":scope > .glass-plaque-two"
        )
      ) {
        return;
      }

      const glassTwo =
        document.createElement("section");

      glassTwo.className =
        "glass-plaque-two";

      glassTwo.setAttribute(
        "aria-label",
        "CyberCrowd Sequence Two"
      );

      stage.appendChild(glassTwo);
    };

  window.addEventListener(
    "cybercrowd:cylinder-turned",
    () => {
      const waitForLanding =
        (event) => {
          if (
            event.propertyName !==
            "transform"
          ) {
            return;
          }

          faceOne.removeEventListener(
            "transitionend",
            waitForLanding
          );

          createGlassTwo();
        };

      faceOne.addEventListener(
        "transitionend",
        waitForLanding
      );
    },
    { once: true }
  );

  return true;
}
