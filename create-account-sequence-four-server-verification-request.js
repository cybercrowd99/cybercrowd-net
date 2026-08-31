/*
CYBERCROWD

REPO:
cybercrowd99/cybercrowd-net

FILE:
create-account-sequence-four-server-verification-request.js

BUILD LAW:
1 FILE
1 JOB
1 FUNCTION

SEQUENCE:
#4

JOB:
Receive crossed SEND security verification
and release the server verification request.

FUNCTION:
installSequenceFourServerVerificationRequest()

INPUT:
cybercrowd:send-security-verification-crossed

OUTPUT:
cybercrowd:server-verification-requested

HEEL IN:
SEND security verification crossed.

HEEL OUT:
Server verification requested.

OWNS:
Server verification request release.

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

export function installSequenceFourServerVerificationRequest() {
  window.addEventListener(
    "cybercrowd:send-security-verification-crossed",
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
          "cybercrowd:server-verification-requested",
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
