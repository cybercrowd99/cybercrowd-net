/*
CYBERCROWD

FILE:
create-account-sequence-four-mail-result-gate.js

BUILD LAW:
1 FILE
1 JOB
1 FUNCTION

BRIDGE:
#6 OF 9

JOB:
Examine one completed mail request
and release only confirmed success.

FUNCTION:
installSequenceFourMailResultGate()

FLEX GATE IN:
cybercrowd:mail-request-completed

SEPARATED GATE OUT:
cybercrowd:verification-email-sent

PAYLOAD:
email

ACTUAL END:
Successful result released once.
Failed result stops closed.
IN gate consumed.
No retry.
*/

export function installSequenceFourMailResultGate() {
  window.addEventListener(
    "cybercrowd:mail-request-completed",
    (event) => {
      const email =
        event?.detail?.email;

      const success =
        event?.detail?.success;

      if (
        success !== true ||
        typeof email !== "string" ||
        email.length === 0
      ) {
        return;
      }

      window.dispatchEvent(
        new CustomEvent(
          "cybercrowd:verification-email-sent",
          {
            detail: {
              email
            }
          }
        )
      );
    },
    { once: true }
  );

  return true;
}
