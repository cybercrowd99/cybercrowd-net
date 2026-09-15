// CYBERCROWD
//
// REPO:
// cybercrowd99/cybercrowd-net
//
// FILE:
// returning-password-capture.js
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
// #7
//
// JOB:
// Capture the typed returning-member
// password from the existing field.
//
// FUNCTION:
// installReturningPasswordCapture()
//
// INPUT:
// #cybercrowd-returning-password
//
// ACTION:
// Enter key
//
// OUTPUT:
// cybercrowd:returning-password-ready
//
// NEXT RECEIVER:
// returning-password-verify-request.js
//
// CORE AUTH REQUEST:
// /api/auth/login
//
// CORE OWNS:
// Password verification.
// Session issuance.
//
// DOES NOT OWN:
// Password field creation.
// CSS.
// Email.
// Identity lookup.
// Password verification.
// Password hashing.
// Password storage.
// API authority.
// Session.
// Cookie.
// Routing.
// Turnstile.
// Movement.

export function installReturningPasswordCapture() {
  window.addEventListener(
    "keydown",
    async (event) => {
      const target =
        event.target;

      if (
        target?.id !==
        "cybercrowd-returning-password"
      ) {
        return;
      }

      if (
        event.key !== "Enter"
      ) {
        return;
      }

      const password =
        String(
          target.value || ""
        );

      if (!password) {
        return;
      }

      const {
        installReturningPasswordVerifyRequest
      } =
        await import(
          "./returning-password-verify-request.js"
        );

      installReturningPasswordVerifyRequest();

      window.dispatchEvent(
        new CustomEvent(
          "cybercrowd:returning-password-ready",
          {
            detail: {
              password
            }
          }
        )
      );
    }
  );
}
