/*
CYBERCROWD

REPO:
cybercrowd99/cybercrowd-net

FILE:
create-account-sequence-four-mail-bridge-in.js

BUILD LAW:
1 FILE
1 JOB
1 FUNCTION

BRIDGE:
#3 OF 9

UIDL:
USER IDENTIFICATION
DIGITAL LANDING

JOB:
Receive one bounded mail order
at the Mail Bridge IN gate.

FUNCTION:
installSequenceFourMailBridgeIn()

FLEX GATE IN:
cybercrowd:mail-order-released

SEPARATED GATE OUT:
cybercrowd:mail-bridge-entered

PAYLOAD:
email

ACTUAL END:
One mail order entered.
Bridge IN consumed.
Bridge OUT released once.

DOES NOT OWN:
Window #3.
SEND.
WHOOSH presentation.
Email validation.
Network.
Postmark.
Golden link.
Verification email.
Delivery result.
Automatic retry.
Account creation.
Password save.
MetadataCenter.
*/

export function installSequenceFourMailBridgeIn() {
  window.addEventListener(
    "cybercrowd:mail-order-released",
    (event) => {
      const email =
        event?.detail?.email;

      if (
        typeof email !== "string" ||
        email.length === 0
      ) {
        return;
      }

      window.dispatchEvent(
        new CustomEvent(
          "cybercrowd:mail-bridge-entered",
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
