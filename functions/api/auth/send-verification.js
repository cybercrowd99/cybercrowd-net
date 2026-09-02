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

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json(
        {
          success: false,
          reason: "invalid-email"
        },
        { status: 400 }
      );
    }

    const tokenRecord = createSetupToken(email);

    if (!tokenRecord || !tokenRecord.token) {
      return Response.json(
        {
          success: false,
          reason: "token-failed"
        },
        { status: 500 }
      );
    }

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

    if (!postmarkKey) {
      return Response.json(
        {
          success: false,
          reason: "missing-postmark-api-key"
        },
        { status: 500 }
      );
    }

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
          Subject: "Your CyberCrowd Setup Link",
          TextBody:
            `Click to continue your CyberCrowd setup:\n\n${verificationUrl}`,
          HtmlBody:
            `<p>Continue your CyberCrowd setup:</p>
             <p><a href="${verificationUrl}">Continue CyberCrowd Setup</a></p>`,
          MessageStream: "outbound"
        })
      }
    );

    const postmarkData =
      await postmarkResponse.json().catch(() => null);

    if (!postmarkResponse.ok) {
      console.error(
        "CYBERCROWD POSTMARK FAILURE:",
        postmarkResponse.status,
        postmarkData
      );

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
