// CYBERCROWD
//
// FILE: human-verify-crossing.js
//
// BUILD LAW:
// 1 FILE
// 1 JOB
// 1 FUNCTION
//
// JOB:
// Connect an existing Turnstile browser token
// to the existing private human-verification crossing.
//
// FUNCTION:
// openHumanVerifyCrossing()
//
// TRACK:
// turnstile-client.js
// → cybercrowd:human-passed
// → human-verify-crossing.js
// → human-verify-client.js
// → POST /api/auth/human-verify
// → cybercrowd-auth
// → server-issued human pass
// → cybercrowd:turnstile-one-verified
//
// DOES NOT OWN:
// Turnstile rendering.
// Turnstile token creation.
// Network request implementation.
// Human verification decision.
// Human-pass creation.
// Human-pass storage.
// Email.
// Authentication.
// Session.
// KV.
// UI.
// Routing.
// Send verification.

import {
  verifyHumanToken
} from "./human-verify-client.js";

export function openHumanVerifyCrossing() {
  window.addEventListener(
    "cybercrowd:human-passed",
    async (event) => {
      const token =
        event?.detail?.token;

      const result =
        await verifyHumanToken(token);

      if (
        result.success !== true ||
        result.human !== true
      ) {
        return;
      }

      window.dispatchEvent(
        new CustomEvent(
          "cybercrowd:turnstile-one-verified"
        )
      );
    }
  );
}
