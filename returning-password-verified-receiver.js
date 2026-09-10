// CYBERCROWD
//
// FILE:
// returning-password-verified-receiver.js
//
// BUILD LAW:
// 1 FILE
// 1 JOB
// 1 FUNCTION
//
// SEQUENCE:
// #9
//
// JOB:
// Receive a successfully verified
// returning member identity and hand
// it forward to the uIDL Control Deck.
//
// FUNCTION:
// installReturningPasswordVerifiedReceiver()
//
// INPUT:
// cybercrowd:returning-password-verified
//
// OUTPUT:
// cybercrowd:uidl-control-deck-required
//
// DOES NOT OWN:
// Password input.
// Password verification.
// Email lookup.
// Identity creation.
// Session creation.
// Cookie creation.
// Routing.
// HTML.
// CSS.
// Control Deck rendering.
// Cartridge Bay.
// Rotator Core.
// HUD emission.
// Routing Bus.
// Cyberseal.
// Purge.
// Turnstile #4.

export function installReturningPasswordVerifiedReceiver() {
  window.addEventListener(
    "cybercrowd:returning-password-verified",
    (event) => {
      const email =
        String(
          event?.detail?.email || ""
        )
          .trim()
          .toLowerCase();

      const identityActiveId =
        String(
          event?.detail?.identity_active_id || ""
        ).trim();

      if (
        !email ||
        !identityActiveId
      ) {
        return;
      }

      window.dispatchEvent(
        new CustomEvent(
          "cybercrowd:uidl-control-deck-required",
          {
            detail: {
              email,
              identity_active_id:
                identityActiveId
            }
          }
        )
      );
    }
  );
}
