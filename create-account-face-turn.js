// CYBERCROWD
//
// REPO: cybercrowd99/cybercrowd-net
// PATH: create-account-face-turn.js
//
// BUILD LAW:
// 1 FILE
// 1 JOB
// 1 FUNCTION
//
// TITLE:
// FACE TURN TWO
//
// JOB:
// Own Create Account automatic Movement #2 only.
//
// FUNCTION:
// installFaceTurn()
//
// CONTROL:
//
// MOVEMENT #1 ALREADY COMPLETE
// 90°
//
// TURNSTILE #1
// GREEN CHECK / TOKEN
// ↓
// cybercrowd:human-passed
// ↓
// MOVEMENT #2
// 90° → 180°
// ↓
// STOP
// ↓
// cybercrowd:face-two-arrived
//
// INPUT:
// cybercrowd:human-passed
//
// OUTPUT:
// cybercrowd:face-two-arrived
//
// POSITION MAP:
// ARRIVAL FROM MOVEMENT #1 = 90°
// MOVEMENT #2 DESTINATION = 180°
//
// TURN TIME:
// 0.09 seconds.
//
// SECURITY BOUNDARY:
// This file moves presentation only.
// It does not grant human authority.
// Private server verification remains separate.
//
// DOES NOT OWN:
// Movement #1.
// Movement #3.
// Human swipe.
// Reverse movement.
// Wheel geometry.
// CSS transition.
// Turn audio.
// Turnstile #1 rendering.
// Turnstile #1 verification.
// Human authorization.
// Email.
// Email activation.
// Send.
// Turnstile #2.
// WHOOSH.
// Authentication.
// Session.
// Routing.

export function installFaceTurn() {
  const TURN_DURATION = 90;

  const MOVEMENT_TWO_START =
    Math.PI / 2;

  const MOVEMENT_TWO_DESTINATION =
    Math.PI;

  let turned = false;

  window.addEventListener(
    "cybercrowd:human-passed",
    () => {
      if (turned) {
        return;
      }

      turned = true;

      document.documentElement.style.setProperty(
        "--cylinder-angle",
        `${MOVEMENT_TWO_DESTINATION}rad`
      );

      window.setTimeout(
        () => {
          window.dispatchEvent(
            new CustomEvent(
              "cybercrowd:face-two-arrived",
              {
                detail: {
                  movement: 2,
                  from: MOVEMENT_TWO_START,
                  to: MOVEMENT_TWO_DESTINATION,
                  degreesMoved: 90,
                  destinationDegrees: 180,
                  duration: TURN_DURATION
                }
              }
            )
          );
        },
        TURN_DURATION
      );
    },
    { once: true }
  );
}
