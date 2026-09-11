// CYBERCROWD
//
// FILE:
// vault-returning-member-turnstile.js
//
// TURNSTILE:
// #3
//
// BUILD LAW:
// 1 FILE
// 1 JOB
// 1 FUNCTION
// NO NESTING
//
// ENTRANCE:
// cybercrowd:returning-member-requested
//
// JOB:
// Open returning-member caretaker Turnstile #3.
//
// EXIT:
// cybercrowd:turnstile-three-passed
//
// DOES NOT OWN:
// Members Only button.
// Vault click movement.
// Turnstile #1.
// Turnstile #2.
// Password creation.
// Password verification.
// Email.
// Authentication.
// Session.
// Cookie.
// Routing.
// Turnstile #4.

window.addEventListener(
  "cybercrowd:returning-member-requested",
  function openTurnstileThree() {
    if (!window.turnstile) {
      return;
    }

    if (
      document.getElementById(
        "turnstile-three"
      )
    ) {
      return;
    }

    const slot =
      document.createElement(
        "div"
      );

    slot.id =
      "turnstile-three";

    slot.style.position =
      "fixed";

    slot.style.inset =
      "0";

    slot.style.display =
      "grid";

    slot.style.placeItems =
      "center";

    slot.style.zIndex =
      "10000";

    slot.style.background =
      "#000";

    document.body.appendChild(
      slot
    );

    window.turnstile.render(
      "#turnstile-three",
      {
        sitekey:
          "0x4AAAAAACvkecVo2F3hpb1r",

        callback:
          async (token) => {
            await import(
              "./turnstile-three-pass-receiver.js"
            );

            window.dispatchEvent(
              new CustomEvent(
                "cybercrowd:turnstile-three-passed",
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
  }
);
