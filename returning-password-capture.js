// CYBERCROWD
//
// FILE:
// returning-password-capture.js
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
// DOES NOT OWN:
// Password field creation.
// CSS.
// Email.
// Identity lookup.
// Password verification.
// API request.
// Session.
// Cookie.
// Routing.
// Turnstile.
// Movement.

export function installReturningPasswordCapture() {
  window.addEventListener(
    "keydown",
    (event) => {
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
