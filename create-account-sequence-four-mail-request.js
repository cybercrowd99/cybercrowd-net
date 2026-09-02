/*
CYBERCROWD

FILE:
create-account-sequence-four-mail-request.js

BUILD LAW:
1 FILE
1 JOB
1 FUNCTION

BRIDGE:
#5 OF 9

JOB:
Send one validated mail order
to the existing verification-email endpoint.

FUNCTION:
installSequenceFourMailRequest()

FLEX GATE IN:
cybercrowd:mail-order-validated

SEPARATED GATE OUT:
cybercrowd:mail-request-completed

PAYLOAD OUT:
email
success
reason

ACTUAL END:
One network request completed.
One result released.
IN gate consumed.
No retry.
*/

import {
  sendVerificationRequest
} from "./request-entry-client.js";

export function installSequenceFourMailRequest() {
  window.addEventListener(
    "cybercrowd:mail-order-validated",
    async (event) => {
      const email =
        event?.detail?.email;

      if (
        typeof email !== "string" ||
        email.length === 0
      ) {
        return;
      }

      const result =
        await sendVerificationRequest({
          ready: true,
          email
        });

      window.dispatchEvent(
        new CustomEvent(
          "cybercrowd:mail-request-completed",
          {
            detail: {
              email,
              success:
                result?.success === true,
              reason:
                result?.reason ||
                "unknown"
            }
          }
        )
      );
    },
    { once: true }
  );

  return true;
}
