// FILE ACTION: REPLACE EXISTING FILE
// FILE: returning-member-continuity.js
// REPO: cybercrowd99/cybercrowd-net
// COMMIT: Route returning member continuity through server authority
// CONTEXT:
// Browser carries the Turnstile token.
// Server verifies Turnstile.
// Server decides member continuity.
// Browser only relays the server result.
//
// INPUT:
// cybercrowd:turnstile-two-token-ready
//
// SERVER:
// /api/auth/returning-member-continuity
//
// YES OUTPUT:
// cybercrowd:returning-member-confirmed
//
// NO OUTPUT:
// cybercrowd:returning-member-retry
//
// BROWSER DOES NOT DECIDE IDENTITY.

function startReturningMemberContinuity() {
  window.addEventListener(
    "cybercrowd:turnstile-two-token-ready",
    async function (event) {
      const token =
        event?.detail?.token;

      if (
        typeof token !== "string" ||
        token.length === 0
      ) {
        return;
      }

      try {
        const response = await fetch(
          "/api/auth/returning-member-continuity",
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              "cf-turnstile-response": token
            })
          }
        );

        const result =
          await response.json();

        if (
          response.ok &&
          result.continuity === true
        ) {
          window.dispatchEvent(
            new CustomEvent(
              "cybercrowd:returning-member-confirmed"
            )
          );

          return;
        }

        window.dispatchEvent(
          new CustomEvent(
            "cybercrowd:returning-member-retry"
          )
        );
      } catch (_) {
        window.dispatchEvent(
          new CustomEvent(
            "cybercrowd:returning-member-retry"
          )
        );
      }
    }
  );
}

startReturningMemberContinuity();
