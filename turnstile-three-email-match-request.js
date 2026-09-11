// CYBERCROWD
//
// REPO:
// cybercrowd99/cybercrowd-net
//
// FILE:
// turnstile-three-email-match-request.js
//
// LOCATION:
// REPOSITORY ROOT / NET
//
// BUILD LAW:
// 1 FILE
// 1 JOB
// 1 FUNCTION
//
// JOB:
// Send the returning-member email
// request to CORE auth and receive
// the identity-match result.
//
// FUNCTION:
// installTurnstileThreeEmailMatchRequest()
//
// INPUT:
// cybercrowd:turnstile-three-email-ready
//
// CORE AUTH REQUEST:
// /api/auth/returning-email-match
//
// CORE OWNS:
// Existing identity lookup.
// Identity match decision.
//
// OUTPUT:
// cybercrowd:returning-identity-match-ready
//
// NEXT RECEIVER:
// returning-identity-password-required.js
//
// FALLBACK OUTPUT:
// cybercrowd:returning-identity-match-missing
//
// DOES NOT OWN:
// Turnstile rendering.
// Email storage.
// Manual email input.
// Identity lookup.
// Identity matching authority.
// Identity creation.
// uIDL creation.
// Password input.
// Password verification.
// Session.
// Cookie.
// CORE auth authority.
// Routing.
// UI.
// Movement.
// Turnstile #4.

export function installTurnstileThreeEmailMatchRequest() {
  window.addEventListener(
    "cybercrowd:turnstile-three-email-ready",
    async (event) => {
      const token =
        event?.detail?.token;

      const email =
        String(
          event?.detail?.email || ""
        )
          .trim()
          .toLowerCase();

      if (!email) {
        return;
      }

      const response =
        await fetch(
          "/api/auth/returning-email-match",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json"
            },
            body: JSON.stringify({
              email
            })
          }
        );

      const result =
        await response
          .json()
          .catch(() => null);

      if (
        !response.ok ||
        !result?.success ||
        !result?.matched ||
        !result?.identity_active_id
      ) {
        window.dispatchEvent(
          new CustomEvent(
            "cybercrowd:returning-identity-match-missing",
            {
              detail: {
                token,
                email
              }
            }
          )
        );

        return;
      }

      const {
        installReturningIdentityPasswordRequired
      } =
        await import(
          "./returning-identity-password-required.js"
        );

      installReturningIdentityPasswordRequired();

      window.dispatchEvent(
        new CustomEvent(
          "cybercrowd:returning-identity-match-ready",
          {
            detail: {
              token,
              email,
              identity_active_id:
                result.identity_active_id
            }
          }
        )
      );
    }
  );
}
