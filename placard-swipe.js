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
Advance the existing glass placard through four fixed
90-degree indexed card positions.

CARD MAP:
CARD 1 =   0°
CARD 2 =  90°
CARD 3 = 180°
CARD 4 = 270°

WHOOSH:
Separate exit movement.
Not owned here.

OWNS:
Pointer-down position.
Swipe threshold.
Card index.
90-degree cylinder-angle update.
Pointer release.

DOES NOT OWN:
Wheel geometry.
CSS animation.
Turnstile.
Email.
Sound.
Send.
Check Email.
WHOOSH.
Authentication.
Routing.
*/

export function installPlacardSwipe() {
  const placard = document.querySelector(".glass-plaque");

  if (!placard) {
    return;
  }

  const CARD_ANGLE = Math.PI / 2;
  const MAX_INDEX = 3;
  const SWIPE_THRESHOLD = 40;

  let startX = 0;
  let cardIndex = 0;
  let dragging = false;

  const setCardAngle = () => {
    const angle = cardIndex * CARD_ANGLE;

    document.documentElement.style.setProperty(
      "--cylinder-angle",
      `${angle}rad`
    );
  };

  placard.addEventListener("pointerdown", (event) => {
    dragging = true;
    startX = event.clientX;
    placard.setPointerCapture(event.pointerId);
  });

  placard.addEventListener("pointerup", (event) => {
    if (!dragging) {
      return;
    }

    const distance = event.clientX - startX;

    if (
      distance <= -SWIPE_THRESHOLD &&
      cardIndex < MAX_INDEX
    ) {
      cardIndex += 1;
      setCardAngle();
    }

    if (
      distance >= SWIPE_THRESHOLD &&
      cardIndex > 0
    ) {
      cardIndex -= 1;
      setCardAngle();
    }

    dragging = false;

    placard.releasePointerCapture(event.pointerId);
  });

  placard.addEventListener("pointercancel", () => {
    dragging = false;
  });

  setCardAngle();
}
