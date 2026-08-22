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
// Render the existing browser Turnstile client
// into the first human-verification slot.
//
// POINT:
// js/turnstile-client.js
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

import { renderTurnstile } from "./js/turnstile-client.js";

export function openTurnstileOne() {
  return renderTurnstile(
    "turnstile-one",
    "0x4AAAAAACvkecVo2F3hpb1r"
  );
}
