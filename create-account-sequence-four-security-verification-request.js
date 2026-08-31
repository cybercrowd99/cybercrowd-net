/*
CYBERCROWD

REPO:
cybercrowd99/cybercrowd-net

FILE:
create-account-sequence-four-security-verification-request.js

BUILD LAW:
1 FILE
1 JOB
1 FUNCTION

SEQUENCE:
#4

JOB:
Receive crossed SEND security
and release server verification request.

FUNCTION:
installSequenceFourSecurityVerificationRequest()

INPUT:
cybercrowd:send-security-crossed

OUTPUT:
cybercrowd:send-security-verification-requested

HEEL IN:
SEND security crossed.

HEEL OUT:
SEND security verification requested.

OWNS:
SEND security verification request release.

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

export function installSequenceFourSecurityVerificationRequest() {
  window.addEventListener(
    "cybercrowd:send-security-crossed",
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
          "cybercrowd:send-security-verification-requested",
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
