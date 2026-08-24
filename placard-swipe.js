// CYBERCROWD
//
// FILE:
// placard-swipe.js
//
// BUILD LAW:
// 1 FILE
// 1 JOB
// 1 FUNCTION
//
// JOB:
// Own human Movement #1.
//
// FUNCTION:
// installPlacardSwipe()
//
// HUMAN:
//
// LEFT
// RIGHT
// UP
// DOWN
//
// ALL VALID.
//
// FLOW:
//
// valid swipe
// ↓
// cybercrowd:cylinder-turned
// ↓
// Audio #1 starts
// ↓
// command 90 degree movement
// ↓
// transform lands
// ↓
// cybercrowd:movement-one-landed
//
// NO TIMER.
// NO STORAGE.
// NO TURNSTILE.

export function installPlacardSwipe() {
  const placard =
    document.querySelector(
      ".glass-plaque"
    );

  if (!placard) {
    return false;
  }

  const MOVEMENT_ONE_ANGLE =
    Math.PI / 2;

  const SWIPE_THRESHOLD =
    40;

  let startX = 0;
  let startY = 0;

  let dragging =
    false;

  let movementOneComplete =
    false;

  placard.style.touchAction =
    "none";

  const setMovementOneAngle =
    () => {
      document.documentElement
        .style
        .setProperty(
          "--cylinder-angle",
          `${MOVEMENT_ONE_ANGLE}rad`
        );
    };

  const publishMovementOne =
    () => {
      window.dispatchEvent(
        new CustomEvent(
          "cybercrowd:cylinder-turned",
          {
            detail: {
              cardIndex: 1,
              movement: 1,
              angle:
                MOVEMENT_ONE_ANGLE,
              degrees: 90
            }
          }
        )
      );
    };

  const publishMovementOneLanded =
    () => {
      window.dispatchEvent(
        new CustomEvent(
          "cybercrowd:movement-one-landed",
          {
            detail: {
              cardIndex: 1,
              movement: 1,
              angle:
                MOVEMENT_ONE_ANGLE,
              degrees: 90,
              landed: true
            }
          }
        )
      );
    };

  placard.addEventListener(
    "pointerdown",
    (event) => {
      if (
        movementOneComplete
      ) {
        return;
      }

      dragging =
        true;

      startX =
        event.clientX;

      startY =
        event.clientY;

      if (
        typeof
          placard.setPointerCapture ===
        "function"
      ) {
        placard.setPointerCapture(
          event.pointerId
        );
      }
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

      const distanceX =
        event.clientX -
        startX;

      const distanceY =
        event.clientY -
        startY;

      const gestureDistance =
        Math.max(
          Math.abs(
            distanceX
          ),
          Math.abs(
            distanceY
          )
        );

      dragging =
        false;

      if (
        typeof
          placard.hasPointerCapture ===
          "function" &&
        placard.hasPointerCapture(
          event.pointerId
        )
      ) {
        placard.releasePointerCapture(
          event.pointerId
        );
      }

      if (
        gestureDistance <
        SWIPE_THRESHOLD
      ) {
        return;
      }

      movementOneComplete =
        true;

      const movementOneLanding =
        (transitionEvent) => {
          if (
            transitionEvent.propertyName !==
            "transform"
          ) {
            return;
          }

          placard.removeEventListener(
            "transitionend",
            movementOneLanding
          );

          publishMovementOneLanded();
        };

      placard.addEventListener(
        "transitionend",
        movementOneLanding
      );

      publishMovementOne();

      setMovementOneAngle();
    }
  );

  placard.addEventListener(
    "pointercancel",
    (event) => {
      dragging =
        false;

      if (
        typeof
          placard.hasPointerCapture ===
          "function" &&
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

  document.documentElement
    .style
    .setProperty(
      "--cylinder-angle",
      "0rad"
    );

  return true;
}
