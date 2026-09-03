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
Receive the existing WHOOSH authorization
and launch the original WHOOSH placard.

FUNCTION:
installWhooshListener()

INPUT:
cybercrowd:whoosh-authorized

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
    "cybercrowd:whoosh-authorized",
    () => {
      showCheckEmailOverlay();
    },
    { once: true }
  );

  return true;
}
