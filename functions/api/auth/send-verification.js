// functions/api/auth/send-verification.js
// CyberCrowd — Verification Email Sender (RESTORED)
// This file was deleted in commit 2c8a659e10ef01ed72d0c520b913d61c980fde26.
// This is the recovery version: clean, linear, no drift.

import { createSetupToken } from "./setup-token.js";
import { storeSetupToken } from "./setup-token-store.js";

export async function onRequestPost(context) {
  try {
    const { request, env } = context;

    // Parse incoming JSON
    const body = await request.json().catch(() => null);
    if (!body || typeof body.email !== "string") {
      return new Response(
        JSON.stringify({ success: false, reason: "invalid-email" }),
        { status: 400 }
      );
    }

    const email = body.email.trim();
    const humanToken = body["cf-turnstile-response"];

    // Basic sanity check
    if (!humanToken || typeof humanToken !== "string") {
      return new Response(
        JSON.stringify({ success: false, reason: "missing-human-token" }),
        { status: 400 }
      );
    }

    // 1. Create setup token
    const tokenRecord = await createSetupToken(email);

    if (!tokenRecord || !tokenRecord.token) {
      return new Response(
        JSON.stringify({ success: false, reason: "token-failed" }),
        { status: 500 }
      );
    }

    // 2. Store token
    const stored = await storeSetupToken(env, tokenRecord);

    if (!stored || stored.success !== true) {
      return new Response(
        JSON.stringify({ success: false, reason: "token-store-failed" }),
        { status: 500 }
      );
    }

    // 3. Build verification URL
    const verificationUrl = `${env.PUBLIC_BASE_URL}/setup.html?setup=${tokenRecord.token}`;

    // 4. Send Postmark email
    const postmarkPayload = {
      From: env.POSTMARK_FROM,
      To: email,
      Subject: "Your CyberCrowd Setup Link",
      TextBody: `Click to continue: ${verificationUrl}`,
      MessageStream: "outbound"
    };

    const postmarkResponse = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": env.POSTMARK_SERVER_TOKEN
      },
      body: JSON.stringify(postmarkPayload)
    });

    if (!postmarkResponse.ok) {
      return new Response(
        JSON.stringify({ success: false, reason: "postmark-rejected" }),
        { status: 502 }
      );
    }

    // 5. Success
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200 }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({
        success: false,
        reason: "exception",
        error: err?.message || "unknown"
      }),
      { status: 500 }
    );
  }
}
