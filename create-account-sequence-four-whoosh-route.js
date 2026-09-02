/*
CYBERCROWD

FILE:
create-account-sequence-four-whoosh-route.js

BUILD LAW:
1 FILE
1 JOB
1 FUNCTION

BRIDGE:
#8 OF 9

JOB:
Route one authorized WHOOSH
from Window #4 to whoosh.html.

FUNCTION:
installSequenceFourWhooshRoute()

FLEX GATE IN:
cybercrowd:whoosh-authorized

SEPARATED GATE OUT:
/whoosh.html

ACTUAL END:
Browser leaves Window #4.
whoosh.html receives the user.
IN gate consumed.
No upstream return.
No retry.
*/

export function installSequenceFourWhooshRoute() {
  window.addEventListener(
    "cybercrowd:whoosh-authorized",
    () => {
      window.location.assign(
        "/whoosh.html"
      );
    },
    { once: true }
  );

  return true;
}
