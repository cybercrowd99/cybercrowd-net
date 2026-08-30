/*
CYBERCROWD

REPO:
cybercrowd99/cybercrowd-net

FILE:
create-account-sequence-four-turnstile-two-completion.js

BUILD LAW:
1 FILE
1 JOB
1 FUNCTION

SEQUENCE:
#4

JOB:
Receive completed Turnstile Two
and release its token.

FUNCTION:
installSequenceFourTurnstileTwoCompletion()

INPUT:
cybercrowd:turnstile-two-passed

OUTPUT:
cybercrowd:turnstile-two-token-ready

HEEL IN:
Turnstile Two passed.

HEEL OUT:
Turnstile Two token ready.

OWNS:
Turnstile Two completion crossing.

DOES NOT OWN:
SEND button.
SEND click.
Email input.
Email validation.
Email readiness.
Turnstile rendering.
Turnstile execution.
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

export function installSequenceFourTurnstileTwoCompletion() {
  window.addEventListener(
    "cybercrowd:turnstile-two-passed",
    (event) => {
      const token =
        event?.detail?.token;

      if (
        typeof token !== "string" ||
        token.length === 0
      ) {
        return;
      }

      window.dispatchEvent(
        new CustomEvent(
          "cybercrowd:turnstile-two-token-ready",
          {
            detail: {
              token
            }
          }
        )
      );
    },
    { once: true }
  );
}
