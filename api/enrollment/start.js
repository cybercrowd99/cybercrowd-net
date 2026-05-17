// /functions/api/enrollment/start.js

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const contentType = request.headers.get("Content-Type") || "";
    if (!contentType.includes("application/json")) {
      return jsonError("Invalid content type. Expected application/json.", 400, "invalid_content_type");
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return jsonError("Invalid JSON body.", 400, "invalid_json");
    }

    const email = normalizeEmail(body.email);
    const tier = typeof body.tier === "string" ? body.tier : "visitor";
    const nextRaw = typeof body.next === "string" ? body.next : "/nav.html";

    if (!email || !isValidEmail(email)) {
      return jsonError("Valid email required.", 400, "invalid_email");
    }

    const next = sanitizeNext(nextRaw);

    const verificationToken = await generateVerificationToken(env, email, tier, next);
    const verifyUrl = buildVerifyUrl(env, verificationToken);

    const providerResult = await sendAccessEmail({
      provider: "postmark", // plug‑and‑play: change this string to switch providers later
      env,
      email,
      tier,
      next,
      verifyUrl
    });

    if (!providerResult.success) {
      return jsonError(
        providerResult.message || "Failed to send access email.",
        providerResult.status || 502,
        providerResult.code || "email_send_failed"
      );
    }

    return jsonOk({
      success: true,
      status: "ok",
      message: "Access link sent. Open your email and click the link.",
      next
    });
  } catch (error) {
    return jsonError("Internal error while processing enrollment.", 500, "internal_error", error);
  }
}

/* ---------- Provider Engine (plug‑and‑play) ---------- */

async function sendAccessEmail(options) {
  const { provider } = options;

  switch (provider) {
    case "postmark":
      return sendWithPostmark(options);
    // Future providers:
    // case "resend":
    //   return sendWithResend(options);
    // case "mailgun":
    //   return sendWithMailgun(options);
    default:
      return {
        success: false,
        status: 500,
        code: "provider_not_supported",
        message: `Email provider not supported: ${provider}`
      };
  }
}

/* ---------- Postmark Implementation (active provider) ---------- */

async function sendWithPostmark({ env, email, tier, next, verifyUrl }) {
  const serverToken = env.POSTMARK_SERVER_TOKEN;
  const fromEmail = env.POSTMARK_FROM_EMAIL || "no-reply@cybercrowd.net";
  const replyEmail = env.POSTMARK_REPLY_EMAIL || fromEmail;

  if (!serverToken) {
    return {
      success: false,
      status: 500,
      code: "missing_postmark_token",
      message: "Postmark server token is not configured."
    };
  }

  const subject = "Your CyberCrowd secure access link";
  const htmlBody = buildHtmlEmail({ email, tier, next, verifyUrl });
  const textBody = buildTextEmail({ email, tier, next, verifyUrl });

  const payload = {
    From: fromEmail,
    To: email,
    ReplyTo: replyEmail,
    Subject: subject,
    HtmlBody: htmlBody,
    TextBody: textBody,
    MessageStream: env.POSTMARK_MESSAGE_STREAM || "outbound"
  };

  const response = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "X-Postmark-Server-Token": serverToken
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    return {
      success: false,
      status: response.status,
      code: "postmark_error",
      message: (data && data.Message) || "Postmark request failed."
    };
  }

  return {
    success: true,
    status: 200,
    code: "sent",
    message: "Postmark email sent."
  };
}

/* ---------- Email Content Builders ---------- */

function buildHtmlEmail({ email, tier, next, verifyUrl }) {
  return `
<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; background-color: #040606; color: #eaffff; padding: 24px;">
    <h2 style="color:#00ffff;">CyberCrowd Secure Access</h2>
    <p>Hello,</p>
    <p>You requested secure access to the CyberCrowd member room.</p>
    <p>Click the button below to verify your email and continue:</p>
    <p>
      <a href="${verifyUrl}"
         style="display:inline-block;padding:12px 20px;background:#00ffff;color:#001111;
                text-decoration:none;border-radius:6px;font-weight:bold;">
        Open Secure Access Link
      </a>
    </p>
    <p>If the button does not work, copy and paste this link into your browser:</p>
    <p style="word-break:break-all;"><code>${verifyUrl}</code></p>
    <hr style="border:none;border-top:1px solid #00ffff33;margin:24px 0;">
    <p style="font-size:12px;color:#b8ffff;">
      Email: ${email}<br>
      Tier: ${tier}<br>
      Next: ${next}
    </p>
  </body>
</html>
`.trim();
}

function buildTextEmail({ email, tier, next, verifyUrl }) {
  return [
    "CyberCrowd Secure Access",
    "",
    "You requested secure access to the CyberCrowd member room.",
    "",
    "Open this link to verify your email and continue:",
    verifyUrl,
    "",
    `Email: ${email}`,
    `Tier: ${tier}`,
    `Next: ${next}`
  ].join("\n");
}

/* ---------- Verification Token + URL ---------- */

async function generateVerificationToken(env, email, tier, next) {
  // Minimal opaque token: base64 of JSON + HMAC could be added later.
  const payload = {
    email,
    tier,
    next,
    ts: Date.now()
  };

  const json = JSON.stringify(payload);
  const encoded = btoa(json);

  // In a more advanced version, you’d sign this with a secret.
  return encoded;
}

function buildVerifyUrl(env, token) {
  const baseUrl = env.VERIFY_BASE_URL || "https://cybercrowd.net";
  const path = "/api/enrollment/verify";
  const url = new URL(path, baseUrl);
  url.searchParams.set("token", token);
  return url.toString();
}

/* ---------- Next Path Sanitization ---------- */

function sanitizeNext(next) {
  try {
    if (!next || typeof next !== "string") {
      return "/nav.html";
    }

    if (!next.startsWith("/") || next.startsWith("//")) {
      return "/nav.html";
    }

    if (next.startsWith("/api/")) {
      return "/nav.html";
    }

    if (next === "/verify-success.html" || next.startsWith("/verify-success.html")) {
      return "/verify-success.html";
    }

    return next;
  } catch {
    return "/nav.html";
  }
}

/* ---------- Helpers ---------- */

function normalizeEmail(value) {
  if (!value || typeof value !== "string") return "";
  return value.trim().toLowerCase();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function jsonOk(data) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}

function jsonError(message, status, code, error) {
  const body = {
    success: false,
    status: code || "error",
    message
  };

  if (error && typeof error === "object") {
    body.detail = String(error.message || error);
  }

  return new Response(JSON.stringify(body), {
    status: status || 500,
    headers: { "Content-Type": "application/json" }
  });
}
