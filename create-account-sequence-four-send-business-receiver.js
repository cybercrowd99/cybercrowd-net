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
and release the SEND business
rail to its next deterministic organ.

FUNCTION:
installSequenceFourSendBusinessReceiver()

INPUT:
cybercrowd:send-business-entered

OUTPUT:
cybercrowd:send-business-received

HEEL IN:
SEND business entered.

HEEL OUT:
SEND business received.

OWNS:
SEND business reception.

DOES NOT OWN:
SEND button.
SEND click.
Email input.
Email validation.
Email readiness.
Turnstile #2.
Turnstile token.
Security decision.
MetadataCenter.
Existing-member decision.
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
          "cybercrowd:send-business-received"
        )
      );
    },
    { once: true }
  );
}
