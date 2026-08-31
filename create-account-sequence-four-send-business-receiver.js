/*
CYBERCROWD

REPO:
cybercrowd99/cybercrowd-net

FILE:
create-account-sequence-four-send-business-receiver.js

BUILD LAW:
1 FILE
1 JOB
1 FUNCTION

SEQUENCE:
#4

JOB:
Receive SEND business entry
and release the existing server-authorized
verification-email request.

FUNCTION:
installSequenceFourSendBusinessReceiver()

INPUT:
cybercrowd:send-business-entered

OUTPUT:
cybercrowd:server-verification-requested

HEEL IN:
SEND business entered.

HEEL OUT:
Server-authorized email request released.

OWNS:
SEND business reception.

DOES NOT OWN:
SEND button.
SEND click.
Email input.
Email validation.
Email readiness.
Turnstile.
Turnstile token.
Human verification.
Human-pass creation.
Human-pass validation.
Human-pass consumption.
Postmark.
Golden link.
Verification email.
WHOOSH.
Authentication.
Session.
Cookie.
Routing.
Backend authority.
Movement.
Rotation.
*/

export function installSequenceFourSendBusinessReceiver() {
  window.addEventListener(
    "cybercrowd:send-business-entered",
    () => {
      window.dispatchEvent(
        new CustomEvent(
          "cybercrowd:server-verification-requested"
        )
      );
    },
    { once: true }
  );
}
