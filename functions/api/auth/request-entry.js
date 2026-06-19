// CyberCrowd Request Entry – Coordinator Only
// No token creation. No KV. No email sending. No session. No cookie.
// Decides only: whether human check is required before send-verification.

import { verifyTurnstileToken } from "./turnstile-verify.js";
import { humanGate } from "./human-gate.js";

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch (_) {
    return json({ success: false, error: "invalid_json" }, 400);
  }

  const email = String(body.email || "").trim();
  const turnstileToken = body["cf-turnstile-response"] || null;

  if (!email) {
    return json({ success: false, error: "missing_email" }, 400);
  }

  if (!turnstileToken) {
    return json({
      success: false,
      human_check_required: true
    });
  }

  const ip = request.headers.get("CF-Connecting-IP");
  const turnstileResult = await verifyTurnstileToken(env, turnstileToken, ip);
  const gate = humanGate(turnstileResult);

  if (!gate.human_passed) {
    return json(
      {
        success: false,
        error: gate.reason || "human_failed"
      },
      403
    );
  }

  const forwardReq = new Request(
    `${new URL(request.url).origin}/api/auth/send-verification`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    }
  );

  return await fetch(forwardReq);
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
