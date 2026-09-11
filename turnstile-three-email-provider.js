// CYBERCROWD
//
// REPO:
// cybercrowd99/cybercrowd-net
//
// FILE:
// turnstile-three-email-provider.js
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
// Provide the returning member email
// after Turnstile #3 token is ready.
//
// FUNCTION:
// installTurnstileThreeEmailProvider()
//
// INPUT:
// cybercrowd:turnstile-three-token-ready
//
// OUTPUT:
// cybercrowd:turnstile-three-email-ready
//
// NEXT RECEIVER:
// turnstile-three-email-match-request.js
//
// FALLBACK OUTPUT:
// cybercrowd:turnstile-three-email-manual-required
//
// DOES NOT OWN:
// Turnstile rendering.
// Turnstile #1.
// Turnstile #2.
// Identity matching.
// Password input.
// Password verification.
// uIDL matching.
// Session.
// Cookie.
// Routing.
// UI.
// Movement.
// Turnstile #4.

export function installTurnstileThreeEmailProvider() {
  window.addEventListener(
    "cybercrowd:turnstile-three-token-ready",
    async (event) => {
      const token =
        event?.detail?.token;

      if (
        typeof token !== "string" ||
        token.length === 0
      ) {
        return;
      }

      const email =
        String(
          window.localStorage.getItem(
            "cc_verified_email"
          ) || ""
        )
          .trim()
          .toLowerCase();

      if (!email) {
        window.dispatchEvent(
          new CustomEvent(
            "cybercrowd:turnstile-three-email-manual-required",
            {
              detail: {
                token
              }
            }
          )
        );

        return;
      }

      const {
        installTurnstileThreeEmailMatchRequest
      } =
        await import(
          "./turnstile-three-email-match-request.js"
        );

      installTurnstileThreeEmailMatchRequest();

      window.dispatchEvent(
        new CustomEvent(
          "cybercrowd:turnstile-three-email-ready",
          {
            detail: {
              token,
              email
            }
          }
        )
      );
    }
  );
}
