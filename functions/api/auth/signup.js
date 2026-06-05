export async function onRequestPost(context) {
  try {
    const body = await context.request.json();

    const email = (body.email || "")
      .trim()
      .toLowerCase();

    const humanToken =
      body.humanToken ||
      body["cf-turnstile-response"] ||
      "";

    const tokenPurpose = String(body.tokenPurpose || "cybercrowd-signin").trim();

    if (!email) {
      return Response.json(
        {
          success: false,
          message: "Access denied.",
          status: "missing_email",
        },
        { status: 400 }
      );
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      return Response.json(
        {
          success: false,
          message: "Access denied.",
          status: "invalid_email",
        },
        { status: 400 }
      );
    }

    if (!humanToken) {
      return Response.json(
        {
          success: false,
          message: "Complete the human check before continuing.",
          status: "missing_human_token",
        },
        { status: 400 }
      );
    }

    const turnstileSecret = context.env.TURNSTILE_SECRET_KEY || "";

    if (!turnstileSecret) {
      return Response.json(
        {
          success: false,
          message: "Human verification service is not active.",
          status: "human_service_inactive",
        },
        { status: 500 }
      );
    }

    const remoteIp =
      context.request.headers.get("CF-Connecting-IP") || "";

    const turnstileForm = new FormData();
    turnstileForm.append("secret", turnstileSecret);
    turnstileForm.append("response", humanToken);

    if (remoteIp) {
      turnstileForm.append("remoteip", remoteIp);
    }

    const turnstileResponse = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: turnstileForm,
      }
    );

    const turnstileData = await turnstileResponse.json();

    if (!turnstileData.success) {
      console.error("CYBERCROWD HUMAN TOKEN FAILURE:", {
        email,
        tokenPurpose,
        errors: turnstileData["error-codes"] || [],
      });

      return Response.json(
        {
          success: false,
          message: "Human verification failed.",
          status: "human_token_failed",
        },
        { status: 403 }
      );
    }

    console.log("CYBERCROWD HUMAN TOKEN VERIFIED:", {
      email,
      tokenPurpose,
      hostname: turnstileData.hostname || "",
      action: turnstileData.action || "",
    });

    // POSTMARK KEY
    const postmarkKey = context.env.POSTMARK_API_KEY || "";

    if (!postmarkKey) {
      return Response.json(
        {
          success: false,
          message: "Verification email service is not active.",
          status: "email_service_inactive",
          emailDelivery: "missing_api_key",
        },
        { status: 500 }
      );
    }

    /*
    CYBERCROWD LIVE PUBLIC EMAIL ENVELOPE
    ------------------------------------
    Sender:
    CyberCrowd <welcome@cybercrowd.net>

    Support/contact in body only:
    cybercrowd_services@yahoo.com
    ------------------------------------
    */

    const fromEmail = "CyberCrowd <welcome@cybercrowd.net>";
    const serviceContactEmail = "cybercrowd_services@yahoo.com";

    const verifyToken = crypto.randomUUID();

    const requestUrl = new URL(context.request.url);
    const origin = requestUrl.origin;

    const verifyUrl =
      origin +
      "/api/auth/verify?token=" +
      encodeURIComponent(verifyToken) +
      "&email=" +
      encodeURIComponent(email);

    const emailSubject = "CyberCrowd access verification";

    const emailText = [
      "CyberCrowd access verification",
      "",
      "Open this link to verify your CyberCrowd access:",
      "",
      verifyUrl,
      "",
      "If you did not request this email, ignore it.",
      "",
      "CyberCrowd Services:",
      serviceContactEmail,
    ].join("\n");

    const emailHtml = `
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>CyberCrowd access verification</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;color:#111111;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
<tr>
<td style="padding:24px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;margin:0 auto;border:1px solid #dddddd;border-radius:12px;">
<tr>
<td style="padding:24px;">
<h1 style="margin:0 0 16px 0;font-size:24px;line-height:1.25;color:#111111;">
CyberCrowd access verification
</h1>

<p style="font-size:16px;line-height:1.6;margin:0 0 18px 0;">
Open the link below to verify your CyberCrowd access.
</p>

<p style="margin:0 0 22px 0;">
<a href="${verifyUrl}" style="display:inline-block;padding:14px 18px;background:#111111;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;">
Verify CyberCrowd Access
</a>
</p>

<p style="font-size:14px;line-height:1.6;margin:0 0 18px 0;">
Copy link:
<br>
<a href="${verifyUrl}" style="color:#0057cc;word-break:break-all;">
${verifyUrl}
</a>
</p>

<p style="font-size:13px;line-height:1.6;margin:0;color:#555555;">
If you did not request this email, ignore it.
<br>
CyberCrowd Services: ${serviceContactEmail}
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

    console.log("CYBERCROWD LIVE ACCESS REQUEST:", email);
    console.log("CYBERCROWD LIVE EMAIL FROM:", fromEmail);
    console.log("CYBERCROWD VERIFY TOKEN:", verifyToken);
    console.log("CYBERCROWD VERIFY URL:", verifyUrl);

    // POSTMARK SEND
    const sendResponse = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        "X-Postmark-Server-Token": postmarkKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        From: fromEmail,
        To: email,
        Subject: emailSubject,
        HtmlBody: emailHtml,
        TextBody: emailText,
        MessageStream: "outbound",
      }),
    });

    const sendData = await sendResponse.json();

    if (!sendResponse.ok) {
      console.error("CYBERCROWD LIVE EMAIL SEND FAILURE:", sendData);

      return Response.json(
        {
          success: false,
          message: sendData.Message || "Access denied.",
          email,
          status: "email_delivery_failed",
          emailDelivery: "failed",
          postmarkStatus: sendResponse.status,
          senderUsed: fromEmail,
          details: sendData,
        },
        { status: 502 }
      );
    }

    const postmarkMessageId = sendData.MessageID || "";

    if (!postmarkMessageId) {
      console.error("CYBERCROWD LIVE EMAIL SEND UNCONFIRMED:", sendData);

      return Response.json(
        {
          success: false,
          message: "Verification email was not confirmed sent.",
          email,
          status: "email_delivery_unconfirmed",
          emailDelivery: "unconfirmed",
          senderUsed: fromEmail,
          details: sendData,
        },
        { status: 502 }
      );
    }

    console.log("CYBERCROWD LIVE VERIFY EMAIL ACCEPTED:", email);
    console.log("CYBERCROWD POSTMARK MESSAGE ID:", postmarkMessageId);

    return Response.json(
      {
        success: true,
        status: "pending_verification",
        message: "Verification email sent. Check your inbox.",
        email,
        emailDelivery: "sent",
        postmarkMessageId,
        senderUsed: fromEmail,
        serviceContactEmail,
        humanVerified: true,
        tokenPurpose,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("CYBERCROWD SIGNUP ERROR:", error);

    return Response.json(
      {
        success: false,
        message: "Access denied.",
        status: "signup_exception",
      },
      { status: 500 }
    );
  }
}
