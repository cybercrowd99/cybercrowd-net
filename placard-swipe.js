/*
CYBERCROWD

REPO:
cybercrowd99/cybercrowd-net

FILE:
placard-swipe.js

BUILD LAW:
1 FILE
1 JOB
1 FUNCTION

JOB:
Own Create Account human swipe Movement #1 only.

FUNCTION:
installPlacardSwipe()

CONTROL:
STATE 0
0°
↓
HUMAN SWIPE LEFT OR RIGHT
↓
MOVEMENT #1
0° → 90°
↓
STOP

SIGNAL:
cybercrowd:cylinder-turned

POSITION MAP:
STATE 0 =   0°
MOVE #1 =  90°

OWNS:
Pointer-down position.
Horizontal swipe threshold.
One-time human Movement #1 permission.
90-degree cylinder-angle update.
Existing cylinder-turn signal publication.
Pointer release.

DOES NOT OWN:
Movement #2.
Movement #3.
180-degree position.
270-degree position.
Reverse movement.
Wheel geometry.
CSS animation.
Turn audio.
Turnstile #1 rendering.
Turnstile #1 verification.
Email.
Email activation.
Send.
Turnstile #2.
Check Email.
WHOOSH.
Authentication.
Routing.
*/

export function installPlacardSwipe() {
  const placard =
    document.querySelector(".stage");

  if (!placard) {
    return;
  }

  const MOVEMENT_ONE_ANGLE =
    Math.PI / 2;

  const SWIPE_THRESHOLD =
    40;

  let startX = 0;
  let dragging = false;
  let movementOneComplete = false;

  const setMovementOneAngle = () => {
    document.documentElement.style.setProperty(
      "--cylinder-angle",
      `${MOVEMENT_ONE_ANGLE}rad`
    );
  };

  const publishMovementOne = () => {
    window.dispatchEvent(
      new CustomEvent(
        "cybercrowd:cylinder-turned",
        {
          detail: {
            cardIndex: 1,
            movement: 1,
            angle: MOVEMENT_ONE_ANGLE,
            degrees: 90
          }
        }
      )
    );
  };

  placard.addEventListener(
    "pointerdown",
    (event) => {
      if (movementOneComplete) {
        return;
      }

      dragging = true;
      startX = event.clientX;

      placard.setPointerCapture(
        event.pointerId
      );
    }
  );

  placard.addEventListener(
    "pointerup",
    (event) => {
      if (
        !dragging ||
        movementOneComplete
      ) {
        return;
      }

      const distance =
        event.clientX - startX;

      const horizontalSwipe =
        Math.abs(distance) >=
        SWIPE_THRESHOLD;

      dragging = false;

      if (
        placard.hasPointerCapture(
          event.pointerId
        )
      ) {
        placard.releasePointerCapture(
          event.pointerId
        );
      }

      if (!horizontalSwipe) {
        return;
      }

      movementOneComplete = true;

      setMovementOneAngle();
      publishMovementOne();
    }
  );

  placard.addEventListener(
    "pointercancel",
    (event) => {
      dragging = false;

      if (
        placard.hasPointerCapture(
          event.pointerId
        )
      ) {
        placard.releasePointerCapture(
          event.pointerId
        );
      }
    }
  );

  document.documentElement.style.setProperty(
    "--cylinder-angle",
    "0rad"
  );
}
