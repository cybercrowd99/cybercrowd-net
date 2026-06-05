export async function onRequestPost({ request, env }) {
  try {
    const authHeader = request.headers.get("Authorization") || "";
    const body = await request.json().catch(() => ({}));

    const identityToken = cleanToken(authHeader || body.token);

    if (!identityToken) {
      return json(
        {
          success: false,
          error: "no identity token",
          status: "missing_identity_token",
        },
        401
      );
    }

    const password = typeof body.password === "string" ? body.password : "";

    if (!password) {
      return json(
        {
          success: false,
          error: "password required",
          status: "password_required",
        },
        400
      );
    }

    if (password.length < 8) {
      return json(
        {
          success: false,
          error: "password must be at least 8 characters",
          status: "password_too_short",
        },
        400
      );
    }

    if (!env.IDENTITY || !env.USERS) {
      return json(
        {
          success: false,
          error: "auth storage not configured",
          status: "auth_storage_missing",
        },
        500
      );
    }

    const identityRecord = await env.IDENTITY.get(identityToken);

    if (!identityRecord) {
      return json(
        {
          success: false,
          error: "invalid identity token",
          status: "invalid_identity_token",
        },
        401
      );
    }

    const identityData = parseIdentityRecord(identityRecord);
    const userId = identityData.userId || "";
    const email = identityData.email || "";

    if (!userId) {
      return json(
        {
          success: false,
          error: "identity token is incomplete",
          status: "incomplete_identity_token",
        },
        401
      );
    }

    const passwordRecord = await hashPassword(password);
    const verifiedAt = new Date().toISOString();

    await env.USERS.put(
      `user:${userId}:password`,
      JSON.stringify(passwordRecord)
    );

    await env.USERS.put(`user:${userId}:verified`, "true");
    await env.USERS.put(`user:${userId}:password_created`, verifiedAt);

    if (email) {
      await env.USERS.put(`user:${userId}:email`, email);
      await env.USERS.put(`email:${email}:userId`, userId);
    }

    if (typeof env.IDENTITY.delete === "function") {
      await env.IDENTITY.delete(identityToken);
    } else {
      await env.IDENTITY.put(identityToken, "", { expirationTtl: 60 });
    }

    console.log("CYBERCROWD PASSWORD LANE COMPLETED:", {
      userId,
      email,
      verifiedAt,
    });

    return json({
      success: true,
      ok: true,
      verified: true,
      passwordCreated: true,
      status: "password_created",
      next: "profile-setup.html",
    });
  } catch (error) {
    console.error("CYBERCROWD SET PASSWORD ERROR:", error);

    return json(
      {
        success: false,
        error: "server error",
        status: "set_password_exception",
      },
      500
    );
  }
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

function cleanToken(value) {
  if (!value || typeof value !== "string") {
    return "";
  }

  return value.replace(/^Bearer\s+/i, "").trim();
}

function parseIdentityRecord(identityRecord) {
  try {
    const parsed = JSON.parse(identityRecord);

    return {
      userId: parsed.userId || "",
      email: parsed.email || "",
    };
  } catch (error) {
    return {
      userId: identityRecord,
      email: "",
    };
  }
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
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );

  return {
    algorithm: "PBKDF2-SHA-256",
    iterations,
    salt: toBase64(salt),
    hash: toBase64(new Uint8Array(derivedBits)),
    createdAt: new Date().toISOString(),
  };
}

function toBase64(bytes) {
  let binary = "";

  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary);
}
