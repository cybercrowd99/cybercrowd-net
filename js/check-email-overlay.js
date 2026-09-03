/*
CYBERCROWD

REPO:
cybercrowd99/cybercrowd-net

LANE:
PUBLIC NET

FILE:
js/check-email-overlay.js

BUILD LAW:
1 FILE
1 JOB
1 FUNCTION

SEQUENCE:
#4

JOB:
Fly in the existing WHOOSH
confirmation after email is sent.

FUNCTION:
showCheckEmailOverlay()

OWNS:
WHOOSH visibility.
WHOOSH fly-in direction.
WHOOSH audio.

DOES NOT OWN:
Email transmission.
Turnstile.
Authentication.
Session.
Routing.
*/

const overlay =
  document.getElementById(
    "check-email-overlay"
  );

const closeBtn =
  document.getElementById(
    "overlay-close"
  );

const whooshAudio =
  document.getElementById(
    "whoosh-audio"
  );

export function showCheckEmailOverlay() {
  if (!overlay) {
    return;
  }

  const flyInClasses = [
    "from-top",
    "from-bottom",
    "from-left",
    "from-right",
    "from-top-left",
    "from-top-right",
    "from-bottom-left",
    "from-bottom-right"
  ];

  overlay.classList.remove(
    "is-visible",
    ...flyInClasses
  );

  const chosenDirection =
    flyInClasses[
      Math.floor(
        Math.random() *
        flyInClasses.length
      )
    ];

  overlay.style.display =
    "grid";

  void overlay.offsetWidth;

  overlay.classList.add(
    chosenDirection,
    "is-visible"
  );

  if (whooshAudio) {
    whooshAudio.currentTime =
      0;

    whooshAudio
      .play()
      .catch(() => {});
  }
}

if (closeBtn) {
  closeBtn.addEventListener(
    "click",
    () => {
      overlay?.classList.remove(
        "is-visible"
      );

      if (overlay) {
        overlay.style.display =
          "none";
      }
    }
  );
}
