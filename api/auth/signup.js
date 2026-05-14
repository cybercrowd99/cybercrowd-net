export async function onRequestPost(context) {
  try {
    const body = await context.request.json();

    const email = (body.email || "")
      .trim()
      .toLowerCase();

    if (!email) {
      return Response.json({
        success: false,
        message: "Email required.",
        status: "email_required",
        emailDelivery: "not_sent"
      }, {
        status: 400
      });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      return Response.json({
        success: false,
        message: "Invalid email format.",
        status: "invalid_email",
        emailDelivery: "not_sent"
      }, {
        status: 400
      });
    }

    const verifyToken = crypto.randomUUID();

    const requestUrl = new URL(context.request.url);
    const origin = requestUrl.origin;

    const verifyUrl =
      origin +
      "/api/enrollment/verify?token=" +
      encodeURIComponent(verifyToken) +
      "&email=" +
      encodeURIComponent(email);

    const serviceReplyEmail =
      context.env.CC_REPLY_TO ||
      "access@cybercrowd.net";

    const fromEmail =
      context.env.CC_EMAIL_FROM ||
      "CyberCrowd <welcome@cybercrowd.net>";

    const resendApiKey =
      context.env.RESEND_API_KEY || "";

    const emailSubject =
      "Verify your CyberCrowd free entry";

    const emailText = [
      "CyberCrowd Free Entry Verification",
      "",
      "You requested free CyberCrowd access.",
      "",
      "Click this verification link to continue:",
      verifyUrl,
      "",
      "If you did not request this, ignore this email.",
      "",
      "CyberCrowd Access:",
      serviceReplyEmail
    ].join("\n");

    const emailHtml =
      `
<div style="
font-family:Arial,sans-serif;
background:#050505;
color:white;
padding:28px;
">
<div style="
max-width:620px;
margin:0 auto;
border:1px solid rgba(0,255,255,.35);
border-radius:22px;
padding:26px;
background:rgba(5,10,18,.96);
">
<h1 style="
color:#00ffff;
letter-spacing:2px;
">
CyberCrowd Free Entry
</h1>

<p style="
line-height:1.7;
opacity:.88;
">
You requested free CyberCrowd access.
Click the verification button below to continue.
</p>

<p>
<a href="${verifyUrl}" style="
display:inline-block;
padding:16px 22px;
border-radius:16px;
background:linear-gradient(90deg,#00ffff,#00ffaa);
color:black;
font-weight:bold;
text-decoration:none;
letter-spacing:1px;
">
VERIFY CYBERCROWD ENTRY
</a>
</p>

<p style="
line-height:1.7;
opacity:.72;
font-size:13px;
">
If the button does not work, copy and paste this link:
<br>
<span style="
color:#00ffaa;
word-break:break-all;
">
${verifyUrl}
</span>
</p>

<p style="
margin-top:24px;
font-size:12px;
opacity:.62;
">
CyberCrowd Access: ${serviceReplyEmail}
</p>
</div>
</div>
`;

    console.log("CYBERCROWD ENROLLMENT REQUEST RECEIVED:", email);
    console.log("CYBERCROWD EMAIL FROM:", fromEmail);
    console.log("CYBERCROWD EMAIL REPLY TO:", serviceReplyEmail);

    if (!resendApiKey) {
      console.error("CYBERCROWD EMAIL SEND BLOCKED: RESEND_API_KEY missing.");

      return Response.json({
        success: false,
        message: "Email provider key is missing. Verification email was not sent.",
        status: "email_provider_not_configured",
        email,
        emailDelivery: "not_configured",
        provider: "resend",
        required_secret: "RESEND_API_KEY",
        verifyUrl
      }, {
        status: 500
      });
    }

    console.log("CYBERCROWD EMAIL SEND STARTING:", email);

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

          subject: emailSubject,

          html: emailHtml,

          text: emailText
        })
      }
    );

    const sendText =
      await sendResponse.text();

    let sendData = {};

    try {
      sendData =
        sendText
          ? JSON.parse(sendText)
          : {};
    } catch (error) {
      sendData = {
        raw: sendText
      };
    }

    console.log("CYBERCROWD EMAIL SEND RESULT:", {
      ok: sendResponse.ok,
      status: sendResponse.status,
      data: sendData
    });

    if (!sendResponse.ok) {
      console.error(
        "CYBERCROWD EMAIL SEND FAILURE:",
        sendData
      );

      return Response.json({
        success: false,

        message:
          "Verification email was not sent. Resend rejected the request.",

        email,

        status:
          "email_delivery_failed",

        provider:
          "resend",

        providerStatus:
          sendResponse.status,

        emailDelivery:
          "failed",

        verifyUrl,

        details:
          sendData
      }, {
        status: 502
      });
    }

    console.log(
      "CYBERCROWD VERIFY EMAIL ACCEPTED BY RESEND:",
      email
    );

    return Response.json({
      success: true,

      status:
        "pending_verification",

      message:
        "Verification email accepted by provider. Check your inbox.",

      email,

      provider:
        "resend",

      providerStatus:
        sendResponse.status,

      providerResponse:
        sendData,

      verifyToken,

      verifyUrl,

      emailDelivery:
        "sent",

      serviceReplyEmail
    }, {
      status: 200
    });

  } catch (error) {
    console.error(
      "CYBERCROWD SIGNUP ERROR:",
      error
    );

    return Response.json({
      success: false,
      message: "Continuity enrollment failure.",
      status: "signup_exception",
      emailDelivery: "not_sent",
      error: String(error && error.message ? error.message : error)
    }, {
      status: 500
    });
  }
}
