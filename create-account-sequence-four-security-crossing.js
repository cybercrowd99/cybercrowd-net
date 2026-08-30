/*
CYBERCROWD

REPO:
cybercrowd99/cybercrowd-net

FILE:
create-account-sequence-four-security-crossing.js

BUILD LAW:
1 FILE
1 JOB
1 FUNCTION

SEQUENCE:
#4

JOB:
Receive the SEND security request
and cross the token to server verification.

FUNCTION:
installSequenceFourSecurityCrossing()

INPUT:
cybercrowd:send-security-requested

OUTPUT:
cybercrowd:send-security-crossed

HEEL IN:
SEND security requested.

HEEL OUT:
SEND security crossed.

OWNS:
SEND security network crossing.

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

export function installSequenceFourSecurityCrossing() {
  window.addEventListener(
    "cybercrowd:send-security-requested",
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
          "cybercrowd:send-security-crossed",
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
