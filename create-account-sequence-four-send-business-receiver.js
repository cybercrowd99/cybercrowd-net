/*
CYBERCROWD

REPO:
cybercrowd99/cybercrowd-net

LANE:
PUBLIC NET

FILE:
create-account-sequence-four-send-business-receiver.js

BUILD LAW:
1 FILE
1 JOB
1 FUNCTION

BRIDGE:
#1 OF 9

ROOM:
BROWSER MAIL-ORDER OUT

JOB:
Receive one SEND-business entry
and release one bounded mail order
through the room's separated OUT gate.

FUNCTION:
installSequenceFourSendBusinessReceiver()

FLEX GATE IN:
cybercrowd:send-business-entered

SEPARATED GATE OUT:
cybercrowd:mail-order-released

PAYLOAD:
email

ACTUAL END:
Mail order released once.
IN gate consumed.
Room closed.

OWNS:
SEND-business reception.
Existing email-value collection.
One mail-order release.

DOES NOT OWN:
SEND button.
SEND click.
Email-input creation.
Email validation.
Email readiness.
Human-authority verification.
Turnstile #1.
Turnstile #2.
Mail-bridge reception.
Network request.
Postmark.
Golden link.
Verification email.
Delivery receipt.
Automatic retry.
Account creation.
Password save.
MetadataCenter.
Authentication.
Session.
Cookie.
Storage.
Routing.
Backend authority.
Movement.
Rotation.

LOOP LAW:
The OUT signal cannot reopen
this room's consumed IN gate.
*/

export function installSequenceFourSendBusinessReceiver() {
  window.addEventListener(
    "cybercrowd:send-business-entered",
    () => {
      const emailInput =
        document.getElementById(
          "email"
        );

      if (!emailInput) {
        return;
      }

      const email =
        emailInput.value
          .trim()
          .toLowerCase();

      if (email.length === 0) {
        return;
      }

      window.dispatchEvent(
        new CustomEvent(
          "cybercrowd:mail-order-released",
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
