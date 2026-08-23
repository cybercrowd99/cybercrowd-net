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
// Open the first public Turnstile surface.
//
// FUNCTION:
// Provide the first human-verification slot
// on the current Create Account stage,
// then render the existing browser Turnstile client into it.
//
// POINT:
// .stage
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
// Email reveal.
// Second Turnstile.
// Send.
// Auth.
// Fetch.
// WHOOSH.
// Routing.
// Backend authority.

import { renderTurnstile } from "./turnstile-client.js";

export function openTurnstileOne() {
  const stage =
    document.querySelector(".stage");

  if (!stage) {
    return false;
  }

  let slot =
    document.getElementById("turnstile-one");

  if (!slot) {
    slot =
      document.createElement("div");

    slot.id = "turnstile-one";

    stage.appendChild(slot);
  }

  return renderTurnstile(
    "turnstile-one",
    "0x4AAAAAACvkecVo2F3hpb1r"
  );
}
