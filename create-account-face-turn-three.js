// CYBERCROWD
//
// REPO:
// cybercrowd99/cybercrowd-net
//
// LANE:
// PUBLIC NET
//
// FILE:
// create-account-face-turn-three.js
//
// BUILD LAW:
// 1 FILE
// 1 JOB
// 1 FUNCTION
//
// TITLE:
// FACE TURN THREE
//
// JOB:
// Own Create Account Movement 3 only.
//
// FUNCTION:
// installFaceTurnThree()
//
// INPUT:
// cybercrowd:movement-three-requested
//
// MOVEMENT:
// 180 degrees
// to
// 270 degrees.
//
// OUTPUT:
// cybercrowd:face-three-arrived
//
// TURN TIME:
// 0.09 seconds.
//
// DOES NOT OWN:
// Sequence 1.
// Sequence 2.
// Sequence 3 presentation.
// Sequence 4 presentation.
// Raw human touch.
// ENTER EMAIL image.
// Email entry.
// Email input.
// SEND.
// Turnstile.
// Verification.
// Audio.
// WHOOSH.
// Authentication.
// Session.
// Routing.
// Backend authority.

export function installFaceTurnThree() {
  const TURN_DURATION =
    90;

  const MOVEMENT_THREE_DESTINATION =
    3 * Math.PI / 2;

  let turned =
    false;

  window.addEventListener(
    "cybercrowd:movement-three-requested",
    () => {
      if (turned) {
        return;
      }

      turned =
        true;

      document.documentElement.style.setProperty(
        "--cylinder-angle",
        `${MOVEMENT_THREE_DESTINATION}rad`
      );

      window.setTimeout(
        () => {
          window.dispatchEvent(
            new CustomEvent(
              "cybercrowd:face-three-arrived"
            )
          );
        },
        TURN_DURATION
      );
    },
    { once: true }
  );

  return true;
}
