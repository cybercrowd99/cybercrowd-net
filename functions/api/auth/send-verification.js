export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();

    const email = String(body.email || "").trim().toLowerCase();
    const turnstileToken = body.turnstileToken || body["cf-turnstile-response"];

    if (!email || !email.includes("@")) {
      return json({ ok: false, error: "valid_email_required" }, 400);
    }

    if (!turnstileToken) {
      return json({ ok: false, error: "human_check_required" }, 403);
    }

    const humanOk = await verifyTurnstile({
      token: turnstileToken,
      secret: env.TURNSTILE_SECRET_KEY,
      ip: request.headers.get("CF-Connecting-IP"),
    });

    if (!humanOk.success) {
      return json(
        {
          ok: false,
          error: "turnstile_failed",
          reason: humanOk["error-codes"] || [],
        },
        403
      );
    }

    /*
      HUMAN VERIFIED.
      Nothing below this line runs unless Turnstile passed.

      Next CyberCrowd steps:
      1. Create setup token.
      2. Store setup:<token> -> email in KV.
      3. Send verification/setup email.
      4. Return check-email response.
    */

    const setupToken = crypto.randomUUID();

    await env.IDENTITY.put(
      `setup:${setupToken}`,
      JSON.stringify({
        email,
        createdAt: Date.now(),
        purpose: "password_setup",
        humanVerified: true,
      }),
      { expirationTtl: 60 * 30 }
    );

    // TODO:
    // Wire this to your email sender.
    // The link should point to:
    // https://cybercrowd.net/set_password.html?token=${setupToken}

    return json({
      ok: true,
      status: "human_verified_email_setup_ready",
      message: "Check your email.",
    });
  } catch (err) {
    return json(
      {
        ok: false,
        error: "server_error",
      },
      500
    );
  }
}

async function verifyTurnstile({ token, secret, ip }) {
  const formData = new FormData();
  formData.append("secret", secret);
  formData.append("response", token);

  if (ip) {
    formData.append("remoteip", ip);
  }

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      body: formData,
    }
  );

  return response.json();
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
