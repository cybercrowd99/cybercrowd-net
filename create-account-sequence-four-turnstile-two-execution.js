// CYBERCROWD
//
// FILE:
// turnstile-two-ui.js
//
// BUILD LAW:
// 1 FILE
// 1 JOB
// 1 FUNCTION
//
// TURNSTILE:
// #2
//
// JOB:
// Open the independent Turnstile #2
// browser checkpoint.
//
// FUNCTION:
// openTurnstileTwo()
//
// DOM POINT:
// #turnstile-two
//
// OUTPUT:
// cybercrowd:turnstile-two-passed
//
// BOUNDARY:
//
// Turnstile #2
// ↓
// real browser token
// ↓
// cybercrowd:turnstile-two-passed
//
// DOES NOT OWN:
// Turnstile #1.
// #turnstile-one.
// cybercrowd:human-passed.
// Human verification decision.
// Email.
// SEND.
// Verification email.
// Movement.
// Rotation.
// WHOOSH.
// Authentication.
// Session.
// Cookie.
// KV.
// Backend authority.

export function openTurnstileTwo() {
  const plaque =
    document.querySelector(
      ".glass-plaque-three"
    );

  if (!plaque) {
    return false;
  }

  if (!window.turnstile) {
    console.warn(
      "Turnstile #2 not yet loaded."
    );

    return false;
  }

  let slot =
    document.getElementById(
      "turnstile-two"
    );

  if (!slot) {
    slot =
      document.createElement(
        "div"
      );

    slot.id =
      "turnstile-two";

    plaque.appendChild(
      slot
    );
  }

  window.turnstile.render(
    "#turnstile-two",
    {
      sitekey:
        "0x4AAAAAACvkecVo2F3hpb1r",

      callback(token) {
        window.dispatchEvent(
          new CustomEvent(
            "cybercrowd:turnstile-two-passed",
            {
              detail: {
                token
              }
            }
          )
        );
      }
    }
  );

  return true;
}
