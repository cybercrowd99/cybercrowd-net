/*
CYBERCROWD

REPO:
cybercrowd99/cybercrowd-net

FILE:
create-account-sequence-four-mail-order-validator.js

BUILD LAW:
1 FILE
1 JOB
1 FUNCTION

BRIDGE:
#4 OF 9

UIDL COMMAND:
VALIDATE MAIL ORDER

JOB:
Validate one email carried
through Mail Bridge IN.

FUNCTION:
installSequenceFourMailOrderValidator()

FLEX GATE IN:
cybercrowd:mail-bridge-entered

SEPARATED GATE OUT:
cybercrowd:mail-order-validated

PAYLOAD:
email

ACTUAL END:
One valid mail order released.
Invalid order stops closed.

DOES NOT OWN:
Window #3.
SEND.
WHOOSH.
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

import {
  validateEmail
} from "./entry-email-validator.js";

export function installSequenceFourMailOrderValidator() {
  window.addEventListener(
    "cybercrowd:mail-bridge-entered",
    (event) => {
      const emailState =
        validateEmail(
          event?.detail?.email
        );

      if (
        !emailState ||
        emailState.valid !== true
      ) {
        return;
      }

      window.dispatchEvent(
        new CustomEvent(
          "cybercrowd:mail-order-validated",
          {
            detail: {
              email: emailState.email
            }
          }
        )
      );
    },
    { once: true }
  );

  return true;
}
