// CYBERCROWD
// REPO: cybercrowd99/cybercrowd-net
// PATH: auth/src/human-verify.ts
//
// BUILD LAW:
// 1 FILE
// 1 JOB
// 1 FUNCTION
//
// JOB:
// Privately verify one REAL Cloudflare Turnstile token.
//
// TRACK:
// REAL CLOUDFLARE TURNSTILE
// → REAL HUMAN TOKEN
// → cybercrowd-auth
// → Cloudflare Siteverify
// → VERIFIED / REJECTED
//
// USED BY:
// TURNSTILE #1 = entry verification
// TURNSTILE #2 = email/send double-check
//
// SECURITY:
// REAL CLOUDFLARE ONLY.
// NO CLIENT AUTHORITY.
// NO FAKE HUMAN STATE.
// NO COOKIE.
// NO LOCAL STORAGE.
// NO TOKEN CREATION.
// NO EMAIL.
// NO KV / D1 WRITE.
// NO POSTMARK.
//
// RAIL:
// ART FROZEN.
// LAYOUT FROZEN.
// FLOW FROZEN.
// FRONTEND UNTOUCHED.

export async function verifyHumanTurnstile(
  env,
  token,
  remoteIp = null
) {
  if (
    typeof token !== "string" ||
    token.length === 0
  ) {
    return {
      verified: false,
      reason: "missing-turnstile-token"
    };
  }

  const form = new FormData();

  form.append(
    "secret",
    env.TURNSTILE_SECRET_KEY
  );

  form.append(
    "response",
    token
  );

  if (remoteIp) {
    form.append(
      "remoteip",
      remoteIp
    );
  }

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: form
      }
    );

    if (!response.ok) {
      return {
        verified: false,
        reason: "turnstile-siteverify-http-failure"
      };
    }

    const result = await response.json();

    const hostnameAllowed =
      result.hostname === "cybercrowd.net" ||
      result.hostname === "www.cybercrowd.net";

    if (
      result.success !== true ||
      hostnameAllowed !== true
    ) {
      return {
        verified: false,
        reason: "turnstile-rejected"
      };
    }

    return {
      verified: true,
      reason: "turnstile-verified"
    };

  } catch (error) {
    return {
      verified: false,
      reason: "turnstile-siteverify-error"
    };
  }
}
