/*
CYBERCROWD

REPO:
cybercrowd99/cybercrowd-net

LANE:
PUBLIC NET

FILE:
entry-whoosh-listener.js

BUILD LAW:
1 FILE
1 JOB
1 FUNCTION

SEQUENCE:
#4

JOB:
Receive the successful email-sent receipt
and release the existing WHOOSH surface.

FUNCTION:
installWhooshListener()

INPUT:
cybercrowd:email-sent

OUTPUT:
showCheckEmailOverlay()

DOES NOT OWN:
Email transmission.
Turnstile.
Authentication.
Session.
Routing.
*/

import {
  showCheckEmailOverlay
} from "./js/check-email-overlay.js";

export function installWhooshListener() {
  window.addEventListener(
    "cybercrowd:email-sent",
    () => {
      showCheckEmailOverlay();
    },
    { once: true }
  );

  return true;
}
