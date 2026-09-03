// functions/api/auth/send-verification.js
// CYBERCROWD — VERIFICATION EMAIL API
//
// REPO:
// cybercrowd99/cybercrowd-net
//
// BUILD LAW:
// 1 FILE
// 1 JOB
// 1 FUNCTION
//
// JOB:
// Receive one validated CyberCrowd email order,
// create and store one setup token,
// send one Postmark verification email,
// return one structured result.
//
// TRACK:
// request-entry-client.js
// → /api/auth/send-verification
// → setup-token.js
// → setup-token-store.js
// → IDENTITY
// → Postmark
// → success:true
//
// STORAGE CONTRACT:
// storeSetupToken(env, key, record)
//
// POSTMARK CONTRACT:
// POSTMARK_API_KEY
// CyberCrowd <welcome@cybercrowd.net>
//
// FREEZE:
// frontend unchanged
// human verification unchanged
// setup-token.js unchanged
// setup-token-store.js unchanged
// verify.js unchanged
// bindings unchanged

import { createSetupToken } from "./setup-token.js";
import { storeSetupToken } from "./setup-token-store.js";

export async function onRequestPost(context) {
  try {
    const { request, env } = context;

    const body = await request.json().catch(() => null);

    if (!body || typeof body.email !== "string") {
      return Response.json(
        {
          success: false,
          reason: "invalid-email"
        },
        { status: 400 }
      );
    }

    const email = body.email.trim().toLowerCase();

    const tokenRecord = createSetupToken(email);

    const kvKey = `setup:${tokenRecord.token}`;

    await storeSetupToken(
      env,
      kvKey,
      tokenRecord
    );

    const origin = new URL(request.url).origin;

    const verificationUrl =
      `${origin}/setup.html?setup=${encodeURIComponent(tokenRecord.token)}`;

    const postmarkKey = env.POSTMARK_API_KEY;

    const sender =
      "CyberCrowd <welcome@cybercrowd.net>";

    const postmarkResponse = await fetch(
      "https://api.postmarkapp.com/email",
      {
        method: "POST",
        headers: {
          "X-Postmark-Server-Token": postmarkKey,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          From: sender,
          To: email,
          Subject: "CyberCrowd Email Verification",
          TextBody:
            `CyberCrowd Email Verification

You recently requested to begin the CyberCrowd entry process.

To continue, use the VERIFY EMAIL ADDRESS button in this message.

If you did not initiate this request, you may safely ignore this message.

Thank you,
CyberCrowd Support`,
          HtmlBody:
            `<div style="margin:0;padding:28px;background:#050505;font-family:Arial,Helvetica,sans-serif;color:#ffffff;">
              <div style="max-width:620px;margin:0 auto;padding:28px;border:1px solid rgba(0,255,255,.35);border-radius:22px;background:#050a12;">
                <h1 style="margin:0 0 22px;color:#00ffff;font-size:28px;line-height:1.25;letter-spacing:2px;">
                  CyberCrowd Email Verification
                </h1>

                <p style="margin:0 0 18px;color:#ffffff;font-size:16px;line-height:1.7;">
                  You recently requested to begin the CyberCrowd entry process.
                </p>

                <p style="margin:0 0 26px;color:#ffffff;font-size:16px;line-height:1.7;">
                  To continue, please verify your email address using the button below.
                </p>

                <p style="margin:0 0 28px;">
                  <a
                    href="${verificationUrl}"
                    style="display:inline-block;padding:16px 24px;border-radius:16px;background:#00ffff;color:#050505;font-size:15px;font-weight:700;letter-spacing:1px;text-decoration:none;"
                  >
                    VERIFY EMAIL ADDRESS
                  </a>
                </p>

                <p style="margin:0 0 24px;color:#c8d4dc;font-size:14px;line-height:1.7;">
                  If you did not initiate this request, you may safely ignore this message.
                </p>

                <p style="margin:0;color:#ffffff;font-size:14px;line-height:1.7;">
                  Thank you,<br>
                  CyberCrowd Support
                </p>
              </div>
            </div>`,
          MessageStream: "outbound"
        })
      }
    );

    if (!postmarkResponse.ok) {
      return Response.json(
        {
          success: false,
          reason: "postmark-rejected",
          status: postmarkResponse.status
        },
        { status: 502 }
      );
    }

    return Response.json(
      {
        success: true,
        message: "Check your email."
      },
      { status: 200 }
    );

  } catch (err) {
    console.error(
      "CYBERCROWD SEND VERIFICATION ERROR:",
      err
    );

    return Response.json(
      {
        success: false,
        reason: "exception",
        error: err?.message || "unknown"
      },
      { status: 500 }
    );
  }
}
