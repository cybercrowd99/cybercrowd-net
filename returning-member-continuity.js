// FILE ACTION: CREATE NEW FILE
// FILE: returning-member-continuity.js
// REPO: cybercrowd99/cybercrowd-net
// COMMIT: Add returning member continuity decision
// CONTEXT:
// After Turnstile #2 passes,
// ask the existing session authority
// whether this returning member
// already has valid continuity.
//
// INPUT:
// cybercrowd:turnstile-two-passed
//
// YES OUTPUT:
// cybercrowd:returning-member-confirmed
//
// NO OUTPUT:
// cybercrowd:returning-member-retry
//
// DOES NOT OWN:
// Turnstile rendering.
// Password verification.
// Email.
// Warning email.
// Voice.
// Session creation.
// Cookie creation.
// Dashboard authority.
// Vault routing.

function startReturningMemberContinuity() {
  window.addEventListener(
    "cybercrowd:turnstile-two-passed",
    async function () {
      try {
        const response = await fetch(
          "/api/auth/dashboard",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store"
          }
        );

        if (response.ok) {
          const data = await response.json();

          window.dispatchEvent(
            new CustomEvent(
              "cybercrowd:returning-member-confirmed",
              {
                detail: {
                  user: data.user || null
                }
              }
            )
          );

          return;
        }

        window.dispatchEvent(
          new CustomEvent(
            "cybercrowd:returning-member-retry"
          )
        );
      } catch (error) {
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
