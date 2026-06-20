import { createSetupToken } from "./setup-token.js";
import { storeSetupToken } from "./setup-token-store.js";

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch (_) {
    return json({ success: false, error: "invalid_json" }, 400);
  }

  const email = String(body.email || "").trim().toLowerCase();

  if (!email || !email.includes("@")) {
    return json({ success: false, error: "valid_email_required" }, 400);
  }

  const tokenRecord = createSetupToken(email);
  const kvKey = `setup:${tokenRecord.token}`;

  try {
    await storeSetupToken(env, kvKey, tokenRecord);
  } catch (_) {
    return json({ success: false, error: "kv_write_failed" }, 500);
  }

  const origin = new URL(request.url).origin;
  const verifyUrl = `${origin}/setup.html?setup=${encodeURIComponent(tokenRecord.token)}`;

  const emailPayload = {
    From: env.CC_EMAIL_FROM,
    To: email,
    ReplyTo: env.CC_REPLY_TO || env.CC_EMAIL_FROM,
    Subject: "Verify your CyberCrowd entry",
    HtmlBody: buildEmailHtml(verifyUrl),
    TextBody: buildEmailText(verifyUrl),
    MessageStream: "outbound"
  };

  try {
    await sendEmail(env, emailPayload);
  } catch (error) {
    return json(
      {
        success: false,
        error: "email_delivery_failed",
        detail: error.message
      },
      502
    );
  }

  return json({
    success: true,
    message: "Check your email."
  });
}

function buildEmailHtml(verifyUrl) {
  return `
    <div style="font-family:Arial,sans-serif;background:#050505;color:white;padding:28px;">
      <div style="max-width:620px;margin:0 auto;border:1px solid rgba(0,255,255,.35);
      border-radius:22px;padding:26px;background:rgba(5,10,18,.96);">
        <h1 style="color:#00ffff;letter-spacing:2px;">CyberCrowd Entry Verification</h1>
        <p style="line-height:1.7;opacity:.88;">
          Click the button below to continue your CyberCrowd entry.
        </p>
        <p>
          <a href="${verifyUrl}" style="display:inline-block;padding:16px 22px;border-radius:16px;
          background:linear-gradient(90deg,#00ffff,#00ffaa);color:black;font-weight:bold;
          text-decoration:none;letter-spacing:1px;">
            VERIFY CYBERCROWD ENTRY
          </a>
        </p>
        <p style="line-height:1.7;opacity:.72;font-size:13px;">
          If the button does not work, copy and paste the verification link from this email into your browser.
        </p>
      </div>
    </div>
  `;
}

function buildEmailText(verifyUrl) {
  return [
    "CyberCrowd Entry Verification",
    "",
    "Click the link below to continue:",
    verifyUrl,
    "",
    "This link is for your CyberCrowd entry only.",
    "If you did not request this, ignore this email."
  ].join("\n");
}

async function sendEmail(env, payload) {
  const apiKey = env.POSTMARK_API_KEY;

  if (!apiKey) {
    throw new Error("missing_postmark_api_key");
  }

  const response = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: {
      "X-Postmark-Server-Token": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`postmark_rejected:${response.status}:${text}`);
  }
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });
}
