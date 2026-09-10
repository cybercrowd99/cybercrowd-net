// CYBERCROWD
//
// FILE:
// returning-password-field.js
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
    () => {
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

      document.body.appendChild(
        input
      );
    }
  );
}
