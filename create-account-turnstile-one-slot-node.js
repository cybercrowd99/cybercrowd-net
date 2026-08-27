// CYBERCROWD
//
// FILE:
// create-account-turnstile-one-slot-node.js
//
// BUILD LAW:
// 1 FILE
// 1 JOB
// 1 FUNCTION
//
// SEQUENCE:
// #2
//
// JOB:
// Create the Turnstile #1 slot
// inside the existing Sequence #2 plaque.
//
// FUNCTION:
// installTurnstileOneSlotNode()
//
// INPUT:
// cybercrowd:turnstile-one-open-requested
//
// ACTION:
// Ensure exactly one
// #turnstile-one
// exists directly inside
// .glass-plaque-two.
//
// OUTPUT:
// cybercrowd:turnstile-one-slot-ready
//
// DOES NOT OWN:
// Plaque creation.
// Touch activation.
// Turnstile rendering.
// Token production.
// Human verification.
// Network.
// Movement.
// Audio.
// Email.
// SEND.
// Authentication.
// Session.
// Routing.
// Backend authority.

export function installTurnstileOneSlotNode() {
  window.addEventListener(
    "cybercrowd:turnstile-one-open-requested",
    () => {
      const plaque =
        document.querySelector(
          ".glass-plaque-two"
        );

      if (!plaque) {
        return;
      }

      let slot =
        plaque.querySelector(
          ":scope > #turnstile-one"
        );

      if (!slot) {
        slot =
          document.createElement(
            "div"
          );

        slot.id =
          "turnstile-one";

        plaque.appendChild(
          slot
        );
      }

      window.dispatchEvent(
        new CustomEvent(
          "cybercrowd:turnstile-one-slot-ready"
        )
      );
    },
    { once: true }
  );

  return true;
}
