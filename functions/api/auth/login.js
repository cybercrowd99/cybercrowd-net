import { getUserRecord, normalizeEmail } from "./user-store.js";
import { createSession } from "./session-create.js";

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers
    }
  });
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
      salt: encoder.encode(email),
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

    const email = normalizeEmail(body?.email);
    const password = String(body?.password || "");

    if (!email || !password) {
      return json(
        {
          success: false,
          error: "missing_credentials"
        },
        400
      );
    }

    const user = await getUserRecord(env, email);

    if (!user) {
      return json(
        {
          success: false,
          error: "account_not_found"
        },
        404
      );
    }

    if (!user.passwordHash) {
      return json(
        {
          success: false,
          error: "password_not_set"
        },
        403
      );
    }

    const suppliedHash = await hashPassword(email, password);

    if (suppliedHash !== user.passwordHash) {
      return json(
        {
          success: false,
          error: "invalid_credentials"
        },
        401
      );
    }

    const session = await createSession(env, email, {
      band: "user"
    });

    return json(
      {
        success: true,
        redirect: "/dashboard-surface.html"
      },
      200,
      {
        "Set-Cookie": session.cookie
      }
    );
  } catch (error) {
    return json(
      {
        success: false,
        error: "login_failed"
      },
      500
    );
  }
}
