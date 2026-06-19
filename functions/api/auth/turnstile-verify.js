// CyberCrowd Turnstile Server Verification – Secret Authority Only
// Owns: server-side verification using Cloudflare env secret.
// Does NOT own: human policy, token creation, KV, email sending, session, cookie.

export async function verifyTurnstileToken(env, token, ip) {
  if (!token) {
    return {
      success: false,
      reason: "missing_token"
    };
  }

  try {
    const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: env.TURNSTILE_SECRET_KEY,
        response: token,
        remoteip: ip || undefined
      })
    });

    const data = await verifyRes.json();

    // Raw Turnstile response is returned to human-gate.js
    return data;

  } catch (err) {
    return {
      success: false,
      reason: "verification_error"
    };
  }
}
