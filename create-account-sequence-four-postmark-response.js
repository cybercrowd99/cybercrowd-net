/*
CYBERCROWD

REPO:
cybercrowd99/cybercrowd-net

LANE:
PUBLIC NET

FILE:
create-account-sequence-four-postmark-response.js

BUILD LAW:
1 FILE
1 JOB
1 FUNCTION

JOB:
Receive the completed verification-email request
and release the existing successful-send receipt.

FUNCTION:
releasePostmarkResponse()

INPUT:
Verification request result.

OUTPUT:
cybercrowd:email-sent

OWNS:
Successful send-result recognition.
Existing email-sent receipt release.

DOES NOT OWN:
Email input.
Email validation.
SEND.
Turnstile.
Human authority.
Network request.
Postmark.
Verification token.
Verification email.
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
  emitSendSuccess
} from "./entry-send-success.js";

export function releasePostmarkResponse(result) {
  if (
    !result ||
    result.success !== true ||
    result.reason !== "email-sent"
  ) {
    return;
  }

  emitSendSuccess();
}
