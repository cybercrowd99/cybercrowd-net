export async function onRequestPost({ request, env }) {
  try {
    const authHeader = request.headers.get("Authorization") || "";
    const body = await request.json().catch(() => ({}));

    const identityToken = cleanToken(authHeader || body.token);

    if (!identityToken) {
      return json({ error: "no identity token" }, 401);
    }

    if (!body.password || typeof body.password !== "string") {
      return json({ error: "password required" }, 400);
    }

    if (body.password.length < 8) {
      return json({ error: "password must be at least 8 characters" }, 400);
    }

    if (!env.IDENTITY || !env.USERS) {
      return json({ error: "auth storage not configured" }, 500);
    }

    const userId = await env.IDENTITY.get(identityToken);

    if (!userId) {
      return json({ error: "invalid identity token" }, 401);
    }

    const passwordRecord = await hashPassword(body.password);

    await env.USERS.put(
      `user:${userId}:password`,
      JSON.stringify(passwordRecord)
    );

    await env.USERS.put(`user:${userId}:verified`, "true");
    await env.USERS.put(`user:${userId}:password_created`, new Date().toISOString());

    if (typeof env.IDENTITY.delete === "function") {
      await env.IDENTITY.delete(identityToken);
    } else {
      await env.IDENTITY.put(identityToken, "", { expirationTtl: 60 });
    }

    return json({
      ok: true,
      verified: true,
      passwordCreated: true,
      next: "profile-setup.html"
    });

  } catch (err) {
    console.error("set_password error:", err);
    return json({ error: "server error" }, 500);
  }
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

function cleanToken(value) {
  if (!value || typeof value !== "string") {
    return "";
  }

  return value.replace(/^Bearer\s+/i, "").trim();
}

async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iterations = 100000;

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations,
      hash: "SHA-256"
    },
    keyMaterial,
    256
  );

  return {
    algorithm: "PBKDF2-SHA-256",
    iterations,
    salt: toBase64(salt),
    hash: toBase64(new Uint8Array(derivedBits)),
    createdAt: new Date().toISOString()
  };
}

function toBase64(bytes) {
  let binary = "";

  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary);
}
