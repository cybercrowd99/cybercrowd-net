// CYBERCROWD
//
// REPO:
// cybercrowd99/cybercrowd-net
//
// FILE:
// returning-identity-password-required.js
//
// LOCATION:
// REPOSITORY ROOT / NET
//
// BUILD LAW:
// 1 FILE
// 1 JOB
// 1 FUNCTION
//
// SEQUENCE:
// #5
//
// JOB:
// Receive a matched returning identity
// and declare that its existing
// password is now required.
//
// FUNCTION:
// installReturningIdentityPasswordRequired()
//
// INPUT:
// cybercrowd:returning-identity-match-ready
//
// OUTPUT:
// cybercrowd:returning-password-required
//
// NEXT RECEIVER:
// returning-password-field.js
//
// DOES NOT OWN:
// Turnstile rendering.
// Turnstile token.
// Email lookup.
// Email matching.
// Manual email input.
// Password field.
// Password capture.
// Password verification.
// Identity creation.
// Session.
// Cookie.
// Routing.
// CSS.
// HTML.
// Movement.
// Turnstile #4.

export function installReturningIdentityPasswordRequired() {
  window.addEventListener(
    "cybercrowd:returning-identity-match-ready",
    async (event) => {
      const token =
        event?.detail?.token;

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

      const {
        installReturningPasswordField
      } =
        await import(
          "./returning-password-field.js"
        );

      installReturningPasswordField();

      window.dispatchEvent(
        new CustomEvent(
          "cybercrowd:returning-password-required",
          {
            detail: {
              token,
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
