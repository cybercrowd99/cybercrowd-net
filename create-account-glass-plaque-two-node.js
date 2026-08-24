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
// after Movement #1 lands,
// then mount Turnstile Widget #1.
//
// FUNCTION:
// installGlassPlaqueTwoNode()
//
// INPUT:
// cybercrowd:movement-one-landed
//
// OUTPUT:
// .glass-plaque-two
// ↓
// Turnstile Widget #1
//
// NO TIMER.
// NO STORAGE.
// NO AUDIO #2.
// NO VERIFICATION MOVEMENT.
// NO SEQUENCE #3.

import {
  openTurnstileOne
} from "./turnstile-one-ui.js";

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

      if (!plaque) {
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
      }

      openTurnstileOne();
    },
    { once: true }
  );

  return true;
}
