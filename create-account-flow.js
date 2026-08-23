/*
CYBERCROWD

FILE:
create-account-flow.js

BUILD LAW:
1 FILE
1 JOB
1 FUNCTION

JOB:
Expose the Email + Send state after Face Two reveal.

FUNCTION:
startCreateAccountFlow()

INPUT:
cybercrowd:face-two-reveal

OUTPUT:
Email entry becomes available.
Send becomes available.

DOES NOT OWN:
Audio.
Wheel movement.
Movement #1.
Movement #2.
Movement #3.
Turnstile rendering.
Turnstile verification.
Email validation.
Email transmission.
Check Email.
Hurry Back.
Authentication.
Session.
Routing.
Backend authority.
*/

export function startCreateAccountFlow() {
  const email =
    document.getElementById("email");

  const send =
    document.getElementById("sendButton");

  let revealed = false;

  window.addEventListener(
    "cybercrowd:face-two-reveal",
    () => {
      if (revealed) {
        return;
      }

      revealed = true;

      if (email) {
        email.disabled = false;
        email.removeAttribute("aria-disabled");
      }

      if (send) {
        send.disabled = false;
        send.setAttribute(
          "aria-disabled",
          "false"
        );
      }
    }
  );
}
