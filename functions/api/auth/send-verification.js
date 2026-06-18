export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();

    const email = String(body.email || "").trim().toLowerCase();
    const turnstileToken = String(
      body.turnstileToken || body["cf-turnstile-response"] || ""
    );

    if (!email || !email.includes("@")) {
      return json({ ok: false, success: false, error: "valid_email_required" }, 400);
    }

    if (!turnstileToken) {
      return json({ ok: false, success: false, error: "human_check_required" }, 403);
    }

    if (!env.TURNSTILE_SECRET_KEY) {
      return json(
        { ok: false, success: false, error: "turnstile_secret_missing" },
        500
      );
    }

    if (!env.IDENTITY) {
      return json(
        { ok: false, success: false, error: "identity_kv_missing" },
        500
      );
    }

    if (!env.POSTMARK_TOKEN) {
      return json(
        { ok: false, success: false, error: "postmark_token_missing" },
        500
      );
    }

    const humanOk = await verifyTurnstile({
      token: turnstileToken,
      secret: env.TURNSTILE_SECRET_KEY,
      ip: request.headers.get("CF-Connecting-IP"),
    });

    if (humanOk.success !== true) {
      return json(
        {
          ok: false,
          success: false,
          error: "turnstile_failed",
          reason: humanOk["error-codes"] || [],
        },
        403
      );
    }

    /*
      HUMAN VERIFIED.
      Nothing below this line runs unless Turnstile passed.

      CyberCrowd flow:
      1. Create setup token.
      2. Store setup:<token> -> email in KV.
      3. Send setup email.
      4. Return success response for the entry window.
    */

    const setupToken = crypto.randomUUID();
    const createdAt = Date.now();
    const expiresAt = createdAt + 1000 * 60 * 30;

    await env.IDENTITY.put(
      `setup:${setupToken}`,
      JSON.stringify({
        email,
        createdAt,
        expiresAt,
        purpose: "password_setup",
        humanVerified: true,
        used: false,
        band: "email-setup",
      }),
      { expirationTtl: 60 * 30 }
    );

    const setupUrl = `https://cybercrowd.net/set_password.html?token=${encodeURIComponent(
      setupToken
    )}`;

    const emailResponse = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": env.POSTMARK_TOKEN,
      },
      body: JSON.stringify({
        From: "verify@cybercrowd.net",
        To: email,
        Subject: "CyberCrowd entry link",
        TextBody:
          `CyberCrowd entry link:\n\n${setupUrl}\n\n` +
          "This link expires in 30 minutes.",
        HtmlBody:
          `<p>CyberCrowd entry link:</p>` +
          `<p><a href="${setupUrl}">Continue</a></p>` +
          `<p>This link expires in 30 minutes.</p>`,
      }),
    });

    if (!emailResponse.ok) {
      const detail = await emailResponse.text();

      await env.IDENTITY.delete(`setup:${setupToken}`);

      return json(
        {
          ok: false,
          success: false,
          error: "email_send_failed",
          detail,
        },
        500
      );
    }

    return json({
      ok: true,
      success: true,
      status: "human_verified_email_sent",
      message: "Check your email.",
    });
  } catch (err) {
    return json(
      {
        ok: false,
        success: false,
        error: "server_error",
      },
      500
    );
  }
}

export async function onRequest() {
  return json(
    {
      ok: false,
      success: false,
      error: "method_not_allowed",
    },
    405
  );
}

async function verifyTurnstile({ token, secret, ip }) {
  const formData = new FormData();

  

  formData.append("secret", secret); // TURNSTILE_SECRET_KEY=*********************** <here
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
