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
Mount and launch the original
Check Email / Hurry Back placard.

FUNCTION:
showCheckEmailOverlay()

INPUT:
cybercrowd:email-sent

OWNS:
WHOOSH placard mount.
WHOOSH fly-in direction.
WHOOSH audio.
Synchronized landing.

DOES NOT OWN:
Email transmission.
Turnstile.
Rotation.
Authentication.
Session.
Routing.
*/

const whooshAudio =
  new Audio(
    "https://pub-660d879738134ba990d1708d015ec763.r2.dev/whooshing-email-sent_1.1s%20teaser.mp3"
  );

whooshAudio.preload =
  "auto";

whooshAudio.setAttribute(
  "playsinline",
  ""
);

whooshAudio.setAttribute(
  "webkit-playsinline",
  ""
);

export function showCheckEmailOverlay() {
  let overlay =
    document.getElementById(
      "check-email-overlay"
    );

  if (!overlay) {
    overlay =
      document.createElement(
        "section"
      );

    overlay.id =
      "check-email-overlay";

    overlay.className =
      "check-email-overlay";

    overlay.setAttribute(
      "aria-live",
      "polite"
    );

    overlay.innerHTML = `
      <div class="check-email-stage">
        <div class="check-email-slab"></div>

        <div class="floating-email-words">
          <div class="floating-email-inner">
            <h2>CHECK YOUR EMAIL</h2>

            <p>
              Your CyberCrowd verification email is on the way.
            </p>

            <p>
              Return through your verification link.
            </p>

            <div class="hurry-back">
              HURRY BACK
            </div>
          </div>
        </div>

        <div
          class="sparkle-glint"
          aria-hidden="true"
        >
          ✦
        </div>
      </div>
    `;

    document.body.appendChild(
      overlay
    );
  }

  const stage =
    overlay.querySelector(
      ".check-email-stage"
    );

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

  if (stage) {
    stage.style.animationDuration =
      Number.isFinite(
        whooshAudio.duration
      ) &&
      whooshAudio.duration > 0
        ? `${whooshAudio.duration}s`
        : "1.1s";
  }

  try {
    whooshAudio.currentTime =
      0;
  } catch (_) {}

  void overlay.offsetWidth;

  overlay.classList.add(
    chosenDirection,
    "is-visible"
  );

  whooshAudio
    .play()
    .catch(() => {});
}
