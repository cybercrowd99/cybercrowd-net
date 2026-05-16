export async function onRequestGet() {
  return Response.json(
    {
      success: true,
      status: "smoke_endpoint_ready",
      method: "POST",
      requiredBody: {
        confirm: "SEND_ONE_EMAIL",
        to: "recipient@example.com"
      }
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}

export async function onRequestPost(context) {
  try {
    const resendApiKey = context.env.RESEND_API_KEY || "";

    if (!resendApiKey) {
      return Response.json(
        {
          success: false,
          status: "missing_resend_api_key",
          message: "RESEND_API_KEY is missing."
        },
        {
          status: 500,
          headers: {
            "Cache-Control": "no-store"
          }
        }
      );
    }

    const body = await safeJson(context.request);

    const confirm = String(body.confirm || "").trim();

    if (confirm !== "SEND_ONE_EMAIL") {
      return Response.json(
        {
          success: false,
          status: "confirmation_required",
          message: "Send POST body with confirm: SEND_ONE_EMAIL"
        },
        {
          status: 400,
          headers: {
            "Cache-Control": "no-store"
          }
        }
      );
    }

    const toEmail =
      String(body.to || context.env.CC_SMOKE_TO || "cybercrowd@yahoo.com")
        .trim()
        .toLowerCase();

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(toEmail)) {
      return Response.json(
        {
          success: false,
          status: "invalid_to_email",
          message: "Valid recipient email required."
        },
        {
          status: 400,
          headers: {
            "Cache-Control": "no-store"
          }
        }
      );
    }

    const fromEmail =
      context.env.CC_EMAIL_FROM ||
      "CyberCrowd <welcome@cybercrowd.net>";

    const replyToEmail =
      context.env.CC_REPLY_TO ||
      "access@cybercrowd.net";

    const nowIso = new Date().toISOString();

    const subject = "CyberCrowd Smoke Test - Real Email Transport";

    const text = [
      "CyberCrowd Smoke Test",
      "",
      "This is a direct Resend transport test.",
      "",
      "If you are reading this, CyberCrowd sent a real email to this inbox.",
      "",
      "This test does not create a cookie.",
      "This test does not open NAV.",
      "This test does not use the security gate.",
      "This test does not use D1.",
      "",
      "Timestamp:",
      nowIso,
      "",
      "From:",
      fromEmail,
      "",
      "Reply-To:",
      replyToEmail
    ].join("\n");

    const html = `
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>CyberCrowd Smoke Test</title>
</head>
<body style="margin:0;padding:0;background:#050505;color:#ffffff;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:620px;margin:0 auto;padding:24px;">
    <div style="border:1px solid #00ffff;border-radius:18px;background:#101414;padding:24px;">
      <h1 style="margin:0 0 14px 0;color:#00ffff;font-size:24px;">
        CyberCrowd Smoke Test
      </h1>

      <p style="font-size:16px;line-height:1.6;color:#ffffff;">
        This is a direct Resend transport test.
      </p>

      <p style="font-size:16px;line-height:1.6;color:#00ffaa;font-weight:bold;">
        If you are reading this, CyberCrowd sent a real email to this inbox.
      </p>

      <p style="font-size:14px;line-height:1.6;color:#b8ffff;">
        No cookie was created.<br>
        NAV was not opened.<br>
        The security gate was not used.<br>
        D1 was not used.
      </p>

      <p style="font-size:12px;line-height:1.6;color:#9fb9b9;">
        Timestamp: ${escapeHtml(nowIso)}<br>
        From: ${escapeHtml(fromEmail)}<br>
        Reply-To: ${escapeHtml(replyToEmail)}
      </p>
    </div>
  </div>
</body>
</html>
`;

    const sendResponse = await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + resendApiKey,
          "Content-Type": "application/json",
          "User-Agent": "CyberCrowd Email Smoke Test"
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [
            toEmail
          ],
          reply_to: replyToEmail,
          subject,
          html,
          text
        })
      }
    );

    const sendText = await sendResponse.text();
    const sendData = parseJsonOrRaw(sendText);

    if (!sendResponse.ok) {
      return Response.json(
        {
          success: false,
          status: "resend_rejected",
          message: "Resend rejected the smoke email.",
          resendStatus: sendResponse.status,
          to: toEmail,
          from: fromEmail,
          replyTo: replyToEmail,
          details: sendData
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
        status: "smoke_email_accepted_by_resend",
        message: "Smoke email accepted by Resend. Check the real inbox and spam folder.",
        resendStatus: sendResponse.status,
        resendEmailId: sendData.id || null,
        to: toEmail,
        from: fromEmail,
        replyTo: replyToEmail,
        timestamp: nowIso,
        details: sendData
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  } catch (error) {
    return Response.json(
      {
        success: false,
        status: "smoke_email_exception",
        message:
          error && error.message
            ? error.message
            : "Smoke email exception."
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

async function safeJson(request) {
  try {
    return await request.json();
  } catch (error) {
    return {};
  }
}

function parseJsonOrRaw(value) {
  if (!value) {
    return {};
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    return {
      raw: value
    };
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
