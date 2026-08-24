// CYBERCROWD
//
// REPO: cybercrowd99/cybercrowd-net
// PATH: turnstile-one-ui.js
//
// BUILD LAW:
// 1 FILE
// 1 JOB
// 1 FUNCTION
// POINT — DO NOT NEST
//
// JOB:
// Open Turnstile Widget #1
// on Sequence #2 clear glass.
//
// FUNCTION:
// openTurnstileOne()
//
// POINT:
// .glass-plaque-two
// → #turnstile-one
// → turnstile-client.js
//
// PRESERVES:
// Existing Turnstile browser client.
// Existing Turnstile site key.
// Existing cybercrowd:human-passed token event.
// Existing human-verification crossing.
//
// DOES NOT OWN:
// Human verification decision.
// Audio.
// Movement.
// Email.
// Authentication.
// Routing.
// Backend authority.

import {
  renderTurnstile
} from "./turnstile-client.js";

export function openTurnstileOne() {
  const plaque =
    document.querySelector(
      ".glass-plaque-two"
    );

  if (!plaque) {
    return false;
  }

  plaque.classList.add(
    "is-active"
  );

  let slot =
    document.getElementById(
      "turnstile-one"
    );

  if (!slot) {
    slot =
      document.createElement("div");

    slot.id =
      "turnstile-one";

    plaque.appendChild(slot);
  }

  return renderTurnstile(
    "turnstile-one",
    "0x4AAAAAACvkecVo2F3hpb1r"
  );
}
