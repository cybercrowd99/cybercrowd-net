export async function onRequestPost(context) {
  try {
    const body = await context.request.json();

    const email = String(body.email || "")
      .trim()
      .toLowerCase();

    const tier = String(body.tier || "visitor")
      .trim()
      .toLowerCase();

    const humanConfirmed =
      body.humanConfirmed === true ||
      body.human_confirmed === true ||
      body.humanConfirmed === "true" ||
      body.human_confirmed === "true";

    const allowedTiers = [
      "visitor",
      "member",
      "creator"
    ];

    if (!email) {
      return Response.json(
        {
          success: false,
          status: "missing_email",
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

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      return Response.json(
        {
          success: false,
          status: "invalid_email",
          message: "Valid email required."
        },
        {
          status: 400,
          headers: {
            "Cache-Control": "no-store"
          }
        }
      );
    }

    if (!allowedTiers.includes(tier)) {
      return Response.json(
        {
          success: false,
          status: "invalid_tier",
          message: "Valid CyberCrowd tier required."
        },
        {
          status: 400,
          headers: {
            "Cache-Control": "no-store"
          }
        }
      );
    }

    if (!humanConfirmed) {
      return Response.json(
        {
          success: false,
          status: "human_not_confirmed",
          message: "Human confirmation required."
        },
        {
          status: 400,
          headers: {
            "Cache-Control": "no-store"
          }
        }
      );
    }

    const enrollmentDb = context.env.ENROLLMENT_DB;

    if (!enrollmentDb) {
      return Response.json(
        {
          success: false,
          status: "missing_enrollment_db",
          message: "Enrollment database binding ENROLLMENT_DB is missing."
        },
        {
          status: 500,
          headers: {
            "Cache-Control": "no-store"
          }
        }
      );
    }

    const resendApiKey = context.env.RESEND_API_KEY || "";

    if (!resendApiKey) {
      return Response.json(
        {
          success: false,
          status: "email_provider_not_configured",
          message: "RESEND_API_KEY is missing. Verification email was not sent.",
          emailDelivery: "not_configured"
        },
        {
          status: 500,
          headers: {
            "Cache-Control": "no-store"
          }
        }
      );
    }

    const enrollmentId = crypto.randomUUID();

    const requestUrl = new URL(context.request.url);
    const origin = requestUrl.origin;

    const tierLabel =
      tier === "visitor"
        ? "Visitor Access"
        : tier === "member"
          ? "Standard Member"
          : "Content Creator";

    const nextStep =
      tier === "visitor"
        ? "visitor_access"
        : tier === "member"
          ? "member_payment_pending"
          : "creator_verification_pending";

    const verifyUrl =
      origin +
      "/api/auth/verify?enrollment=" +
      encodeURIComponent(enrollmentId) +
      "&tier=" +
      encodeURIComponent(tier) +
      "&email=" +
      encodeURIComponent(email);

    const fromEmail =
      context.env.CC_EMAIL_FROM ||
      "CyberCrowd <welcome@cybercrowd.net>";

    const replyToEmail =
      context.env.CC_REPLY_TO ||
      "cybercrowd_services@yahoo.com";

    const subject = "Verify your CyberCrowd access";

    const initialDetails = {
      source: "api_enrollment_start",
      stage: "created_before_email",
      email,
      tier,
      tierLabel,
      nextStep,
      senderUsed: fromEmail,
      replyToEmail,
      verifyUrl
    };

    await enrollmentDb
      .prepare(
        `INSERT INTO enrollments (
          enrollment_id,
          email,
          tier,
          human_confirmed,
          status,
          email_delivery,
          resend_email_id,
          resend_status,
          sender_used,
          verify_url,
          next_step,
          details_json
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        enrollmentId,
        email,
        tier,
        1,
        "enrollment_recorded",
        "not_attempted",
        null,
        null,
        fromEmail,
        verifyUrl,
        nextStep,
        JSON.stringify(initialDetails)
      )
      .run();

    const text = [
      "CyberCrowd Access Verification",
      "",
      "You requested CyberCrowd access for:",
      email,
      "",
      "Access tier:",
      tierLabel,
      "",
      "Click this verification link:",
      verifyUrl,
      "",
      "If you did not request this, ignore this email.",
      "",
      "CyberCrowd Support:",
      replyToEmail
    ].join("\n");

    const safeEmail = escapeHtml(email);
    const safeVerifyUrl = escapeHtml(verifyUrl);
    const safeReplyTo = escapeHtml(replyToEmail);
    const safeTierLabel = escapeHtml(tierLabel);

    const html = `
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Verify your CyberCrowd access</title>
</head>
<body style="margin:0;padding:0;background:#050505;color:#ffffff;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
<tr>
<td style="padding:24px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;margin:0 auto;border:1px solid rgba(0,255,255,0.42);border-radius:18px;background:#101414;">
<tr>
<td style="padding:24px;">
<h1 style="margin:0 0 14px 0;font-size:24px;line-height:1.25;color:#00ffff;letter-spacing:1px;">
Verify your CyberCrowd access
</h1>

<p style="font-size:16px;line-height:1.6;margin:0 0 16px 0;color:#ffffff;">
You requested CyberCrowd access for:
<br>
<strong style="color:#00ffaa;">${safeEmail}</strong>
</p>

<p style="font-size:15px;line-height:1.6;margin:0 0 16px 0;color:#00ffaa;">
Tier: ${safeTierLabel}
</p>

<p style="margin:0 0 22px 0;">
<a href="${safeVerifyUrl}" style="display:inline-block;padding:14px 18px;background:linear-gradient(90deg,#00ffff,#00ffaa);color:#001111;text-decoration:none;border-radius:10px;font-weight:bold;">
VERIFY CYBERCROWD ACCESS
</a>
</p>

<p style="font-size:13px;line-height:1.6;margin:0 0 18px 0;color:#b8ffff;">
If the button does not work, copy and paste this link:
<br>
<a href="${safeVerifyUrl}" style="color:#00ffff;word-break:break-all;">
${safeVerifyUrl}
</a>
</p>

<p style="font-size:12px;line-height:1.6;margin:0;color:#9fb9b9;">
Enrollment ID: ${enrollmentId}
<br>
CyberCrowd Support: ${safeReplyTo}
</p>
</td>
</tr>
</table>
</td>
</tr>
</table>
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
          "User-Agent": "CyberCrowd Enrollment Gateway"
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [
            email
          ],
          reply_to: replyToEmail,
          subject,
          html,
          text
        })
      }
    );

    const sendText = await sendResponse.text();

    let sendData = {};

    if (sendText) {
      try {
        sendData = JSON.parse(sendText);
      } catch (parseError) {
        sendData = {
          raw: sendText
        };
      }
    }

    if (!sendResponse.ok) {
      const failedDetails = {
        source: "api_enrollment_start",
        stage: "resend_failed_after_d1_record",
        email,
        tier,
        tierLabel,
        nextStep,
        senderUsed: fromEmail,
        replyToEmail,
        resendStatus: sendResponse.status,
        resendResponse: sendData
      };

      await enrollmentDb
        .prepare(
          `UPDATE enrollments
           SET
           status = ?,
           email_delivery = ?,
           resend_status = ?,
           sender_used = ?,
           details_json = ?,
           updated_at = CURRENT_TIMESTAMP
           WHERE enrollment_id = ?`
        )
        .bind(
          "enrollment_recorded_email_failed",
          "failed",
          sendResponse.status,
          fromEmail,
          JSON.stringify(failedDetails),
          enrollmentId
        )
        .run();

      return Response.json(
        {
          success: false,
          status: "enrollment_recorded_email_failed",
          message: "CyberCrowd enrollment was recorded, but Resend rejected the email.",
          email,
          tier,
          tierLabel,
          enrollmentId,
          nextStep,
          emailDelivery: "failed",
          resendStatus: sendResponse.status,
          senderUsed: fromEmail,
          replyToEmail,
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

    const resendEmailId = sendData.id || "";

    const successDetails = {
      source: "api_enrollment_start",
      stage: "resend_accepted_after_d1_record",
      email,
      tier,
      tierLabel,
      nextStep,
      resendEmailId,
      resendStatus: sendResponse.status,
      senderUsed: fromEmail,
      replyToEmail
    };

    await enrollmentDb
      .prepare(
        `UPDATE enrollments
         SET
         status = ?,
         email_delivery = ?,
         resend_email_id = ?,
         resend_status = ?,
         sender_used = ?,
         details_json = ?,
         updated_at = CURRENT_TIMESTAMP
         WHERE enrollment_id = ?`
      )
      .bind(
        "enrollment_started",
        "accepted_by_resend",
        resendEmailId,
        sendResponse.status,
        fromEmail,
        JSON.stringify(successDetails),
        enrollmentId
      )
      .run();

    return Response.json(
      {
        success: true,
        status: "enrollment_started",
        message: "CyberCrowd enrollment started. Check your inbox.",
        email,
        tier,
        tierLabel,
        enrollmentId,
        nextStep,
        emailDelivery: "accepted_by_resend",
        resendEmailId,
        senderUsed: fromEmail,
        replyToEmail
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
        status: "enrollment_exception",
        message:
          error && error.message
            ? error.message
            : "Enrollment server exception."
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

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
