/*
CYBERCROWD

FILE:
create-account-sequence-four-send-business-entry.js

BUILD LAW:
1 FILE
1 JOB
1 FUNCTION

SEQUENCE:
#4

JOB:
Accept one enabled human SEND touch
and enter SEND business.

FUNCTION:
installSequenceFourSendBusinessEntry()

INPUT:
#sendButton

OUTPUT:
cybercrowd:send-business-entered

HEEL IN:
One enabled human SEND click.

HEEL OUT:
SEND business entered.

OWNS:
SEND business entry.

DOES NOT OWN:
Email readiness.
Turnstile #2.
Security decision.
MetadataCenter.
Existing-member decision.
Postmark.
Golden link.
Verification email.
WHOOSH.
Authentication.
Session.
Routing.
*/

export function installSequenceFourSendBusinessEntry() {
  const sendButton =
    document.getElementById(
      "sendButton"
    );

  if (!sendButton) {
    return false;
  }

  sendButton.addEventListener(
    "click",
    () => {
      if (sendButton.disabled) {
        return;
      }

      window.dispatchEvent(
        new CustomEvent(
          "cybercrowd:send-business-entered"
        )
      );
    },
    { once: true }
  );

  return true;
}
