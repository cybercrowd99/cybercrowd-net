/*
CYBERCROWD

REPO:
cybercrowd99/cybercrowd-net

LANE:
PUBLIC NET

FILE:
create-account-sequence-four-request-entry-release.js

BUILD LAW:
1 FILE
1 JOB
1 FUNCTION

JOB:
Carry the prepared verification-email request
through the existing request client
to the existing Postmark response organ.

FUNCTION:
releaseRequestEntry()

INPUT:
Email.

OUTPUT:
Verification request result
to releasePostmarkResponse().

OWNS:
Request-client handoff.

DOES NOT OWN:
Email input.
Email validation.
SEND.
Turnstile.
Human authority.
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
*/

import {
  sendVerificationRequest
} from "./request-entry-client.js";

import {
  releasePostmarkResponse
} from "./create-account-sequence-four-postmark-response.js";

export async function releaseRequestEntry(email) {
  const result =
    await sendVerificationRequest({
      ready: true,
      email
    });

  releasePostmarkResponse(
    result
  );
}
