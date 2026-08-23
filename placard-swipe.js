/*
CYBERCROWD
FILE: placard-swipe.js

BUILD LAW:
1 FILE
1 JOB
1 ACTION

JOB:
Own the human placard swipe input only.

ACTION:
Translate horizontal human drag across the existing glass placard
into the cylinder-angle value already consumed by wheel-turn.css.

FLOW POSITION:
REGISTER
→ CREATE ACCOUNT
→ HUMAN SWIPE
→ PLACARD TURNS
→ NEXT SURFACE

OWNS:
Pointer-down position.
Horizontal swipe distance.
Cylinder-angle update.
Pointer release.

DOES NOT OWN:
Wheel geometry.
CSS animation.
Turnstile.
Email.
Sound.
Send.
Check Email.
Authentication.
Routing.
*/

export function installPlacardSwipe() {
  const placard = document.querySelector(".glass-plaque");

  if (!placard) {
    return;
  }

  let startX = 0;
  let currentAngle = 0;
  let dragging = false;

  placard.addEventListener("pointerdown", (event) => {
    dragging = true;
    startX = event.clientX;
    placard.setPointerCapture(event.pointerId);
  });

  placard.addEventListener("pointermove", (event) => {
    if (!dragging) {
      return;
    }

    const distance = event.clientX - startX;
    const angle = currentAngle + distance * 0.0045;

    document.documentElement.style.setProperty(
      "--cylinder-angle",
      `${angle}rad`
    );
  });

  placard.addEventListener("pointerup", (event) => {
    if (!dragging) {
      return;
    }

    const distance = event.clientX - startX;

    currentAngle += distance * 0.0045;
    dragging = false;

    placard.releasePointerCapture(event.pointerId);
  });

  placard.addEventListener("pointercancel", () => {
    dragging = false;
  });
}
