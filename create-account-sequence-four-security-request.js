/*
CYBERCROWD

REPO:
cybercrowd99/cybercrowd-net

FILE:
create-account-sequence-four-security-request.js

BUILD LAW:
1 FILE
1 JOB
1 FUNCTION

SEQUENCE:
#4

JOB:
Receive the Turnstile Two token
and release the SEND security request.

FUNCTION:
installSequenceFourSecurityRequest()

INPUT:
cybercrowd:turnstile-two-token-ready

OUTPUT:
cybercrowd:send-security-requested

HEEL IN:
Turnstile Two token ready.

HEEL OUT:
SEND security requested.

OWNS:
SEND security request crossing.

DOES NOT OWN:
SEND button.
SEND click.
Email input.
Email validation.
Email readiness.
Turnstile rendering.
Turnstile execution.
Turnstile completion.
Turnstile verification.
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

export function installSequenceFourSecurityRequest() {
  window.addEventListener(
    "cybercrowd:turnstile-two-token-ready",
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
          "cybercrowd:send-security-requested",
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
