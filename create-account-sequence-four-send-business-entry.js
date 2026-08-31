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

INSTALL TRIGGER:
cybercrowd:face-three-arrived

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
SEND button creation.
SEND presentation.
SEND readiness.
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
Cookie.
Storage.
Routing.
Backend authority.
Movement.
Rotation.
*/

export function installSequenceFourSendBusinessEntry() {
  window.addEventListener(
    "cybercrowd:face-three-arrived",
    () => {
      const sendButton =
        document.getElementById(
          "sendButton"
        );

      if (!sendButton) {
        return;
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
    },
    { once: true }
  );

  return true;
}
