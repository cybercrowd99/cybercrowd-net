// CYBERCROWD
//
// REPO: cybercrowd99/cybercrowd-net
// PATH: create-account-swipe-cue.js
//
// BUILD LAW:
// 1 FILE
// 1 JOB
// 1 FUNCTION
//
// JOB:
// Present the Sequence #1 swipe cue on the glass plaque.
//
// FUNCTION:
// installSwipeCue()
//
// PRESENTS:
// <----------"SWIPE"---------->
//
// DOES NOT OWN:
// Swipe detection.
// Pointer events.
// Movement #1.
// Wheel geometry.
// Audio.
// Turnstile.
// Email.
// Send.
// Authentication.
// Routing.

export function installSwipeCue() {
  const plaque =
    document.querySelector(".glass-plaque");

  if (!plaque) {
    return false;
  }

  if (
    document.getElementById(
      "create-account-swipe-cue"
    )
  ) {
    return false;
  }

  const cue =
    document.createElement("div");

  cue.id =
    "create-account-swipe-cue";

  cue.textContent =
    '<----------"SWIPE"---------->';

  plaque.appendChild(cue);

  return true;
}
