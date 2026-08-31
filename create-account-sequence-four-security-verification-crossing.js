/*
CYBERCROWD

REPO:
cybercrowd99/cybercrowd-net

FILE:
create-account-sequence-four-security-verification-crossing.js

BUILD LAW:
1 FILE
1 JOB
1 FUNCTION

SEQUENCE:
#4

JOB:
Receive the SEND security verification request
and cross its token to server verification.

FUNCTION:
installSequenceFourSecurityVerificationCrossing()

INPUT:
cybercrowd:send-security-verification-requested

OUTPUT:
cybercrowd:send-security-verification-crossed

HEEL IN:
SEND security verification requested.

HEEL OUT:
SEND security verification crossed.

OWNS:
SEND security verification crossing.

DOES NOT OWN:
SEND button.
SEND click.
Email input.
Email validation.
Email readiness.
Turnstile rendering.
Turnstile execution.
Turnstile completion.
Turnstile token creation.
Server verification.
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

export function installSequenceFourSecurityVerificationCrossing() {
  window.addEventListener(
    "cybercrowd:send-security-verification-requested",
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
          "cybercrowd:send-security-verification-crossed",
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
