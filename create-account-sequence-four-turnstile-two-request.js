/*
CYBERCROWD

REPO:
cybercrowd99/cybercrowd-net

FILE:
create-account-sequence-four-turnstile-two-request.js

BUILD LAW:
1 FILE
1 JOB
1 FUNCTION

SEQUENCE:
#4

JOB:
Receive SEND business
and request Turnstile Two.

FUNCTION:
installSequenceFourTurnstileTwoRequest()

INPUT:
cybercrowd:send-business-received

OUTPUT:
cybercrowd:turnstile-two-requested

HEEL IN:
SEND business received.

HEEL OUT:
Turnstile Two requested.

OWNS:
Turnstile Two request.

DOES NOT OWN:
SEND button.
SEND click.
Email input.
Email validation.
Email readiness.
Turnstile rendering.
Turnstile execution.
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

export function installSequenceFourTurnstileTwoRequest() {
  window.addEventListener(
    "cybercrowd:send-business-received",
    () => {
      window.dispatchEvent(
        new CustomEvent(
          "cybercrowd:turnstile-two-requested"
        )
      );
    },
    { once: true }
  );
}
