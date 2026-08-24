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
// after Movement #1 lands.
//
// FUNCTION:
// installGlassPlaqueTwoNode()
//
// INPUT:
// cybercrowd:movement-one-landed
//
// OUTPUT:
// .glass-plaque-two
//
// NO TIMER.
// NO STORAGE.
// NO TURNSTILE.
// NO AUDIO.
// NO VERIFICATION.
// NO MOVEMENT #2.
// NO ENTRY LOGIC.

export function installGlassPlaqueTwoNode() {
  const stage =
    document.querySelector(
      ".stage"
    );

  if (!stage) {
    return false;
  }

  window.addEventListener(
    "cybercrowd:movement-one-landed",
    () => {
      let plaque =
        stage.querySelector(
          ":scope > .glass-plaque-two"
        );

      if (plaque) {
        return;
      }

      plaque =
        document.createElement(
          "section"
        );

      plaque.className =
        "glass-plaque-two";

      plaque.setAttribute(
        "aria-label",
        "CyberCrowd Sequence Two"
      );

      stage.appendChild(
        plaque
      );
    },
    { once: true }
  );

  return true;
}
