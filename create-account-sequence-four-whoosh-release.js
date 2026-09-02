/*
CYBERCROWD

FILE:
create-account-sequence-four-whoosh-release.js

BUILD LAW:
1 FILE
1 JOB
1 FUNCTION

BRIDGE:
#7 OF 9

JOB:
Release one WHOOSH authorization
after verification email success.

FUNCTION:
installSequenceFourWhooshRelease()

FLEX GATE IN:
cybercrowd:verification-email-sent

SEPARATED GATE OUT:
cybercrowd:whoosh-authorized

ACTUAL END:
One WHOOSH authorization released.
IN gate consumed.
No upstream return.
No retry.
*/

export function installSequenceFourWhooshRelease() {
  window.addEventListener(
    "cybercrowd:verification-email-sent",
    () => {
      window.dispatchEvent(
        new CustomEvent(
          "cybercrowd:whoosh-authorized"
        )
      );
    },
    { once: true }
  );

  return true;
}
