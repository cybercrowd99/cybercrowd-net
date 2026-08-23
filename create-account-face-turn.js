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
// JOB:
// Turn the existing Create Account glass surface
// exactly 180 degrees after server human verification succeeds.
//
// FUNCTION:
// installFaceTurn()
//
// INPUT:
// cybercrowd:turnstile-one-verified
//
// OUTPUT:
// cybercrowd:cylinder-turned
// cybercrowd:face-two-arrived
//
// CONTROL:
// cybercrowd:turnstile-one-verified
// → --cylinder-angle
// → wheel-turn.css
// → .stage::before
//
// FACE MAP:
// FACE 1 = 0°
// FACE 2 = 180°
//
// TURN TIME:
// 0.09 seconds.
//
// DOES NOT OWN:
// Glass geometry.
// CSS transition.
// Turn audio generation.
// Turnstile.
// Human verification decision.
// Face-two content reveal.
// Email.
// Send.
// WHOOSH.
// Authentication.
// Session.
// Routing.

export function installFaceTurn() {
  const TURN_DURATION = 90;
  const FACE_TWO_ANGLE = Math.PI;

  let turned = false;

  window.addEventListener(
    "cybercrowd:turnstile-one-verified",
    () => {
      if (turned) {
        return;
      }

      turned = true;

      window.dispatchEvent(
        new CustomEvent(
          "cybercrowd:cylinder-turned",
          {
            detail: {
              from: 0,
              to: FACE_TWO_ANGLE,
              degrees: 180,
              duration: TURN_DURATION
            }
          }
        )
      );

      document.documentElement.style.setProperty(
        "--cylinder-angle",
        `${FACE_TWO_ANGLE}rad`
      );

      window.setTimeout(
        () => {
          window.dispatchEvent(
            new CustomEvent(
              "cybercrowd:face-two-arrived",
              {
                detail: {
                  face: 2,
                  angle: FACE_TWO_ANGLE,
                  degrees: 180
                }
              }
            )
          );
        },
        TURN_DURATION
      );
    }
  );
}
