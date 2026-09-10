// CYBERCROWD
//
// FILE:
// returning-password-verify-request.js
//
// BUILD LAW:
// 1 FILE
// 1 JOB
// 1 FUNCTION
//
// SEQUENCE:
// #8
//
// JOB:
// Send the returning-member
// email + password to the
// existing password verifier.
//
// FUNCTION:
// installReturningPasswordVerifyRequest()
//
// INPUT:
// cybercrowd:returning-password-ready
//
// REQUEST:
// /api/auth/login
//
// PASS OUTPUT:
// cybercrowd:returning-password-verified
//
// FAIL OUTPUT:
// cybercrowd:returning-password-rejected
//
// DOES NOT OWN:
// Password field.
// Password capture.
// Email creation.
// Email verification.
// Identity creation.
// Password hashing.
// Password storage.
// Session creation.
// Cookie creation.
// Routing.
// CSS.
// HTML.
// Movement.
// Turnstile.

export function installReturningPasswordVerifyRequest() {
  window.addEventListener(
    "cybercrowd:returning-password-ready",
    async (event) => {
      const password =
        String(
          event?.detail?.password || ""
        );

      if (!password) {
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
            "cybercrowd:returning-password-rejected",
            {
              detail: {
                error:
                  "email_missing"
              }
            }
          )
        );

        return;
      }

      const response =
        await fetch(
          "/api/auth/login",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              email,
              password
            })
          }
        );

      const result =
        await response
          .json()
          .catch(() => null);

      if (
        !response.ok ||
        !result?.success
      ) {
        window.dispatchEvent(
          new CustomEvent(
            "cybercrowd:returning-password-rejected",
            {
              detail: {
                email,
                error:
                  result?.error ||
                  "verification_failed"
              }
            }
          )
        );

        return;
      }

      window.dispatchEvent(
        new CustomEvent(
          "cybercrowd:returning-password-verified",
          {
            detail: {
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
