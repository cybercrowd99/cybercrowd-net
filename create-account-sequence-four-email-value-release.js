/*
CYBERCROWD

REPO:
cybercrowd99/cybercrowd-net

LANE:
PUBLIC NET

FILE:
create-account-sequence-four-email-value-release.js

BUILD LAW:
1 FILE
1 JOB
1 FUNCTION

SEQUENCE:
#4

JOB:
Receive the server verification request
and release the existing email value
to the request-entry carrier.

FUNCTION:
installSequenceFourEmailValueRelease()

INPUT:
cybercrowd:server-verification-requested

OUTPUT:
releaseRequestEntry(email)

HEEL IN:
Server verification requested.

HEEL OUT:
Existing email value released.

OWNS:
Existing email-value release.

DOES NOT OWN:
Email node creation.
Email validation.
Email readiness.
SEND.
Turnstile.
Security verification.
Network implementation.
Response interpretation.
Postmark.
Verification token.
Verification email.
email-sent.
WHOOSH.
HURRY BACK.
Overlay.
Audio.
Authentication.
Session.
Cookie.
Routing.
Backend authority.
Movement.
Rotation.
*/

import {
  releaseRequestEntry
} from "./create-account-sequence-four-request-entry-release.js";

export function installSequenceFourEmailValueRelease() {
  window.addEventListener(
    "cybercrowd:server-verification-requested",
    () => {
      const emailNode =
        document.getElementById(
          "email"
        );

      if (!emailNode) {
        return;
      }

      const email =
        String(
          emailNode.value || ""
        ).trim();

      if (!email) {
        return;
      }

      releaseRequestEntry(
        email
      );
    },
    { once: true }
  );
}
