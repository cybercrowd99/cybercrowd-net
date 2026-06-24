function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers
    }
  });
}

function makeToken(bytes = 32) {
  const array = new Uint8Array(bytes);
  crypto.getRandomValues(array);
  return [...array].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hashPassword(email, password) {
  const encoder = new TextEncoder();

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: encoder.encode(email.toLowerCase()),
      iterations: 150000,
      hash: "SHA-256"
    },
    keyMaterial,
    256
  );

  return [...new Uint8Array(bits)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json().catch(() => null);

    const setupToken = body?.setupToken || "";
    const password = body?.password || "";

    if (!setupToken) {
      return json({ success: false, error: "missing_setup_token" }, 400);
    }

    if (!password || password.length < 8) {
      return json({ success: false, error: "password_too_short" }, 400);
    }

    if (!env.IDENTITY) {
      return json({ success: false, error: "identity_kv_missing" }, 500);
    }

    const setupKey = `setup:${setupToken}`;
    const setupRecordRaw = await env.IDENTITY.get(setupKey);

    if (!setupRecordRaw) {
      return json({ success: false, error: "invalid_or_expired_setup_token" }, 403);
    }

    let setupRecord;

    try {
      setupRecord = JSON.parse(setupRecordRaw);
    } catch {
      return json({ success: false, error: "setup_record_corrupt" }, 500);
    }

    const email = String(setupRecord.email || "").toLowerCase().trim();
    const identityActiveId = String(setupRecord["identity-active-id"] || "").trim();

    if (!email || !email.includes("@")) {
      return json({ success: false, error: "setup_email_invalid" }, 500);
    }

    if (!identityActiveId) {
      return json({ success: false, error: "identity_active_id_missing" }, 500);
    }

    const passwordHash = await hashPassword(email, password);
    const now = Date.now();
    const eat = makeToken(32);

    const userRecord = {
      "identity-active-id": identityActiveId,
      email,
      verified: true,
      passwordHash,
      createdAt: setupRecord.createdAt || now,
      passwordSetAt: now,
      updatedAt: now
    };

    const sessionRecord = {
      eat,
      "identity-active-id": identityActiveId,
      email,
      epoch: now,
      band: "user"
    };

    await env.IDENTITY.put(`user:${identityActiveId}`, JSON.stringify(userRecord));
    await env.IDENTITY.put(`user-email:${email}`, identityActiveId);

    await env.IDENTITY.put(`session:${eat}`, JSON.stringify(sessionRecord), {
      expirationTtl: 86400 * 7
    });

    await env.IDENTITY.delete(setupKey);

    return json(
      {
        success: true,
        redirect: "/dashboard-surface.html"
      },
      200,
      {
        "Set-Cookie": `EAT=${eat}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${86400 * 7}`
      }
    );
  } catch (error) {
    return json(
      {
        success: false,
        error: "set_password_failed"
      },
      500
    );
  }
}
