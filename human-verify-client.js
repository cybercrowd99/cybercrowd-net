// CYBERCROWD
//
// FILE: human-verify-client.js
//
// BUILD LAW:
// 1 FILE
// 1 JOB
// 1 FUNCTION
//
// JOB:
// Carry one existing Turnstile browser token
// across the network boundary to private auth.
//
// FUNCTION:
// verifyHumanToken(token)
//
// TRACK:
// turnstile-client.js
// → Turnstile token
// → human-verify-client.js
// → POST /api/auth/human-verify
// → cybercrowd-auth
// → server validation
// → server-issued human pass
//
// DOES NOT OWN:
// Turnstile rendering.
// Turnstile token creation.
// Human verification decision.
// Human-pass creation.
// Human-pass storage.
// Authentication.
// Email.
// Session.
// KV.
// UI.
// Routing.
// Send verification.

export async function verifyHumanToken(token) {
  if (
    typeof token !== "string" ||
    token.length === 0
  ) {
    return {
      success: false,
      human: false,
      reason: "missing-turnstile-token"
    };
  }

  try {
    const response = await fetch(
      "/api/auth/human-verify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "same-origin",
        body: JSON.stringify({
          "cf-turnstile-response": token
        })
      }
    );

    const result =
      await response.json().catch(() => null);

    if (
      response.ok &&
      result &&
      result.success === true &&
      result.human === true
    ) {
      return {
        success: true,
        human: true,
        reason: "server-human-pass-established"
      };
    }

    return {
      success: false,
      human: false,
      reason:
        result?.reason ||
        "human-verification-rejected"
    };

  } catch (err) {
    return {
      success: false,
      human: false,
      reason: "human-verify-network-error"
    };
  }
}
