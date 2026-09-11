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
// to the existing identity matcher.
//
// FUNCTION:
// installTurnstileThreeEmailMatchRequest()
//
// INPUT:
// cybercrowd:turnstile-three-email-ready
//
// REQUEST:
// /api/auth/returning-email-match
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
// Identity creation.
// uIDL creation.
// Password input.
// Password verification.
// Session.
// Cookie.
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
