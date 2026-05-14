function textEncoder() {
  return new TextEncoder();
}

function base64UrlEncodeBytes(bytes) {
  let binary = "";

  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function signPayloadPart(payloadPart, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder().encode(secret),
    {
      name: "HMAC",
      hash: "SHA-256"
    },
    false,
    [
      "sign"
    ]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    textEncoder().encode(payloadPart)
  );

  return new Uint8Array(signature);
}

async function createSignedToken(payload, secret) {
  const payloadJson = JSON.stringify(payload);
  const payloadPart = base64UrlEncodeBytes(textEncoder().encode(payloadJson));
  const signatureBytes = await signPayloadPart(payloadPart, secret);
  const signaturePart = base64UrlEncodeBytes(signatureBytes);

  return payloadPart + "." + signaturePart;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sanitizeNext(value) {
  if (!value) {
    return "/";
  }

  const raw = String(value).trim();

  if (!raw.startsWith("/")) {
    return "/";
  }

  if (raw.startsWith("//")) {
    return "/";
  }

  try {
    const parsed = new URL(raw, "https://cybercrowd.net");
    const safe = parsed.pathname + parsed.search + parsed.hash;

    if (safe === "/page2.html" || safe.startsWith("/page2.html?verified=1")) {
      return "/";
    }

    if (safe === "/verify-success.html" || safe.startsWith("/verify-success.html")) {
      return "/";
    }

    return safe;
  } catch (error) {
    return "/";
  }
}

function getNextFromReferer(request) {
  const referer = request.headers.get("Referer") || "";

  if (!referer) {
    return "";
  }

  try {
    const refererUrl = new URL(referer);
    return refererUrl.searchParams.get("next") || "";
  } catch (error) {
    return "";
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function onRequestPost(context) {
  try {
    const request = context.request;
    const env = context.env;

    let body = {};

    try {
      body = await request.json();
    } catch (error) {
      body = {};
    }

    const email = String(body.email || "")
      .trim()
      .toLowerCase();

    if (!email) {
      return Response.json(
        {
          success: false,
          status: "email_required",
          emailDelivery: "not_sent",
          message: "Email required."
        },
        {
          status: 400,
          headers: {
            "Cache-Control": "no-store"
          }
        }
      );
    }

    if (!isValidEmail(email)) {
      return Response.json(
        {
          success: false,
          status: "invalid_email",
          emailDelivery: "not_sent",
          message: "Invalid email format."
        },
        {
          status: 400,
          headers: {
            "Cache-Control": "no-store"
          }
        }
      );
    }

    const sessionSecret = env.CC_SESSION_SECRET || "";

    if (!sessionSecret) {
      return Response.json(
        {
          success: false,
          status: "session_secret_missing",
          emailDelivery: "not_sent",
          message: "CC_SESSION_SECRET is missing. Verification email was not sent because the verification token cannot be signed.",
          required_secret: "CC_SESSION_SECRET"
        },
        {
          status: 500,
          headers: {
            "Cache-Control": "no-store"
          }
        }
      );
    }

    const resendApiKey = env.RESEND_API_KEY || "";

    if (!resendApiKey) {
      return Response.json(
        {
          success: false,
          status: "email_provider_not_configured",
          emailDelivery: "not_configured",
          provider: "resend",
          message: "RESEND_API_KEY is missing. Verification email was not sent.",
          required_secret: "RESEND_API_KEY"
        },
        {
          status: 500,
          headers: {
            "Cache-Control": "no-store"
          }
        }
      );
    }

    const requestUrl = new URL(request.url);
    const origin = requestUrl.origin;

    const bodyNext = body.next || "";
    const refererNext = getNextFromReferer(request);
    const next = sanitizeNext(refererNext || bodyNext || "/");

    const now = Math.floor(Date.now() / 1000);
    const verifyExpiresAt = now + (15 * 60);

    const verifyToken = await createSignedToken(
      {
        type: "verify",
        email,
        next,
        iat: now,
        exp: verifyExpiresAt
      },
      sessionSecret
    );

    const verifyUrl =
      origin +
      "/api/enrollment/verify?token=" +
      encodeURIComponent(verifyToken);

    const serviceReplyEmail =
      env.CC_REPLY_TO ||
      "access@cybercrowd.net";

    const fromEmail =
      env.CC_EMAIL_FROM ||
      "CyberCrowd <welcome@cybercrowd.net>";

    const safeEmail = escapeHtml(email);
    const safeVerifyUrl = escapeHtml(verifyUrl);

    const subject = "Verify your CyberCrowd access";

    const text = [
      "CyberCrowd Access Verification",
      "",
      "You requested CyberCrowd access for:",
      email,
      "",
      "Click this verification link:",
      verifyUrl,
      "",
      "This link expires in 15 minutes.",
      "",
      "If you did not request this, ignore this email.",
      "",
      "CyberCrowd Access:",
      serviceReplyEmail
    ].join("\n");

    const html = `
<div style="font-family:Arial,sans-serif;background:#050505;color:white;padding:28px;">
  <div style="max-width:620px;margin:0 auto;border:1px solid rgba(0,255,255,.35);border-radius:22px;padding:26px;background:rgba(5,10,18,.96);">
    <h1 style="color:#00ffff;letter-spacing:2px;">CyberCrowd Access Verification</h1>

    <p style="line-height:1.7;opacity:.88;">
      You requested CyberCrowd access for:
      <br>
      <strong style="color:#00ffaa;">${safeEmail}</strong>
    </p>

    <p>
      <a href="${safeVerifyUrl}" style="display:inline-block;padding:16px 22px;border-radius:16px;background:linear-gradient(90deg,#00ffff,#00ffaa);color:black;font-weight:bold;text-decoration:none;letter-spacing:1px;">
        VERIFY CYBERCROWD ACCESS
      </a>
    </p>

    <p style="line-height:1.7;opacity:.72;font-size:13px;">
      This link expires in 15 minutes.
    </p>

    <p style="line-height:1.7;opacity:.72;font-size:13px;">
      If the button does not work, copy and paste this link:
      <br>
      <span style="color:#00ffaa;word-break:break-all;">${safeVerifyUrl}</span>
    </p>

    <p style="margin-top:24px;font-size:12px;opacity:.62;">
      CyberCrowd Access: ${escapeHtml(serviceReplyEmail)}
    </p>
  </div>
</div>
`;

    console.log("CYBERCROWD EMAIL VERIFICATION START:", {
      email,
      next,
      fromEmail,
      serviceReplyEmail
    });

    const sendResponse = await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + resendApiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [
            email
          ],
          reply_to: serviceReplyEmail,
          subject,
          html,
          text
        })
      }
    );

    const responseText = await sendResponse.text();

    let providerResponse = {};

    try {
      providerResponse = responseText ? JSON.parse(responseText) : {};
    } catch (error) {
      providerResponse = {
        raw: responseText
      };
    }

    console.log("CYBERCROWD RESEND RESPONSE:", {
      ok: sendResponse.ok,
      status: sendResponse.status,
      providerResponse
    });

    if (!sendResponse.ok) {
      return Response.json(
        {
          success: false,
          status: "email_delivery_failed",
          emailDelivery: "failed",
          provider: "resend",
          providerStatus: sendResponse.status,
          message: "Verification email was not sent. Resend rejected the request.",
          details: providerResponse
        },
        {
          status: 502,
          headers: {
            "Cache-Control": "no-store"
          }
        }
      );
    }

    return Response.json(
      {
        success: true,
        status: "verification_email_sent",
        emailDelivery: "sent",
        provider: "resend",
        providerStatus: sendResponse.status,
        providerResponse,
        email,
        next,
        message: "Verification email accepted by provider. Check your inbox."
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  } catch (error) {
    console.error("CYBERCROWD SIGNUP ERROR:", error);

    return Response.json(
      {
        success: false,
        status: "signup_exception",
        emailDelivery: "not_sent",
        message: "CyberCrowd verification start failed.",
        error: String(error && error.message ? error.message : error)
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  }
}
