// CYBERCROWD
//
// REPO:
// cybercrowd99/cybercrowd-net
//
// FILE:
// returning-password-field.js
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
// #6
//
// JOB:
// Draw one password input field
// for a matched returning member.
//
// FUNCTION:
// installReturningPasswordField()
//
// INPUT:
// cybercrowd:returning-password-required
//
// OUTPUT:
// DOM object:
// #cybercrowd-returning-password
//
// NEXT RECEIVER:
// returning-password-capture.js
//
// DOES NOT OWN:
// CSS.
// Email.
// Identity lookup.
// Password capture.
// Password verification.
// Submit action.
// Session.
// Cookie.
// Routing.
// Turnstile.
// Movement.

export function installReturningPasswordField() {
  window.addEventListener(
    "cybercrowd:returning-password-required",
    async () => {
      if (
        document.getElementById(
          "cybercrowd-returning-password"
        )
      ) {
        return;
      }

      const input =
        document.createElement(
          "input"
        );

      input.id =
        "cybercrowd-returning-password";

      input.type =
        "password";

      input.name =
        "password";

      input.placeholder =
        "Password";

      input.autocomplete =
        "current-password";

      const {
        installReturningPasswordCapture
      } =
        await import(
          "./returning-password-capture.js"
        );

      installReturningPasswordCapture();

      document.body.appendChild(
        input
      );
    }
  );
}
