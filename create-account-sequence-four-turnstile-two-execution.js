/*
CYBERCROWD

REPO:
cybercrowd99/cybercrowd-net

FILE:
create-account-sequence-four-turnstile-two-execution.js

BUILD LAW:
1 FILE
1 JOB
1 FUNCTION

SEQUENCE:
#4

JOB:
Receive Turnstile Two request
and release Turnstile Two execution.

FUNCTION:
installSequenceFourTurnstileTwoExecution()

INPUT:
cybercrowd:turnstile-two-requested

OUTPUT:
cybercrowd:turnstile-two-execution-requested

HEEL IN:
Turnstile Two requested.

HEEL OUT:
Turnstile Two execution requested.

OWNS:
Turnstile Two execution release.

DOES NOT OWN:
SEND button.
SEND click.
Email input.
Email validation.
Email readiness.
Turnstile rendering.
Turnstile completion.
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

export function installSequenceFourTurnstileTwoExecution() {
  window.addEventListener(
    "cybercrowd:turnstile-two-requested",
    () => {
      window.dispatchEvent(
        new CustomEvent(
          "cybercrowd:turnstile-two-execution-requested"
        )
      );
    },
    { once: true }
  );
}
