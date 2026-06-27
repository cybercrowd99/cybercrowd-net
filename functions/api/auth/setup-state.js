/**
 * functions/api/auth/setup-state.js
 *
 * CyberCrowd Setup State
 *
 * ONE JOB:
 * Read setup token and return email without consuming token.
 *
 * This is NOT Turnstile.
 * This is NOT password creation.
 * This is NOT session creation.
 * This does NOT delete the setup token.
 *
 * setup.html calls this route before password entry.
 */

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });
}

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    if (!env || !env.IDENTITY) {
      return json({ ok: false, error: "identity_kv_missing" }, 500);
    }

    const body = await request.json().catch(() => null);
    const setupToken = String(
      body?.token ||
      body?.setupToken ||
      body?.setup ||
      ""
    ).trim();

    if (!setupToken) {
      return json({ ok: false, error: "missing_setup_token" }, 400);
    }

    const setupKey = "setup:" + setupToken;
    const raw = await env.IDENTITY.get(setupKey);

    if (!raw) {
      return json({ ok: false, error: "invalid_or_expired_setup_token" }, 404);
    }

    let record;

    try {
      record = JSON.parse(raw);
    } catch {
      return json({ ok: false, error: "setup_record_corrupt" }, 500);
    }

    const email = String(record.email || "").toLowerCase().trim();
    const identityActiveId = String(
      record["identity-active-id"] ||
      record.identity_active_id ||
      record.identityActiveId ||
      ""
    ).trim();

    if (!email || !email.includes("@")) {
      return json({ ok: false, error: "setup_email_invalid" }, 500);
    }

    if (!identityActiveId) {
      return json({ ok: false, error: "identity_active_id_missing" }, 500);
    }

    return json({
      ok: true,
      success: true,
      email,
      ownerEmail: email,
      identity_active_id: identityActiveId,
      setup_token_valid: true,
      consumed: false
    });
  } catch {
    return json({ ok: false, error: "setup_state_failed" }, 500);
  }
}
