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

WINDOW:
#4

JOB:
Receive one Window #4
SEND-business crossing
and release one downstream
WHOOSH request.

FUNCTION:
installSequenceFourSendBusinessReceiver()

FLEX GATE IN:
cybercrowd:send-business-entered

SEPARATED GATE OUT:
cybercrowd:whoosh-requested

ACTUAL END:
One WHOOSH request released.
IN gate consumed.
Window #4 OUT closed.

OWNS:
Window #4 SEND-business reception.
Window #4 downstream WHOOSH release.

DOES NOT OWN:
Window #1.
Window #2.
Window #3.
Upstream movement.
SEND button.
SEND click.
Email input.
Email validation.
Turnstile rectangle.
Turnstile rendering.
Human verification.
WHOOSH presentation.
whoosh.html.
Mail bridge.
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

DIRECTION LAW:
Window #4 OUT
may move downstream only.

FORBIDDEN:
Window #4 OUT
must never wake Window #3.

LOOP LAW:
WHOOSH OUT cannot return
through this consumed IN gate.
*/

export function installSequenceFourSendBusinessReceiver() {
  window.addEventListener(
    "cybercrowd:send-business-entered",
    () => {
      window.dispatchEvent(
        new CustomEvent(
          "cybercrowd:whoosh-requested"
        )
      );
    },
    { once: true }
  );

  return true;
}
