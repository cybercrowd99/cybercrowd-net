/**
 * FILE ACTION: REPLACE EXISTING FILE
 * FILE: functions/api/auth/login.js
 * REPO: cybercrowd99/cybercrowd-net
 * COMMIT: Repair returning member password verification
 * CONTEXT:
 * Verify one returning member's
 * password against the password
 * record already belonging to
 * that same root identity.
 *
 * Supports:
 *
 * 1. Canonical passwordRecord
 *    produced by password-hash.js
 *
 * 2. Existing CyberCrowd
 *    PBKDF2 email-salted record
 *    already written by the
 *    current set-password.js
 *
 * One file.
 * One job.
 *
 * No account creation.
 * No password creation.
 * No password mutation.
 * No setup-token handling.
 * No attachment handling.
 * No pacifier handling.
 * No profile mutation.
 */

import {
  getUserRecord,
  normalizeEmail,
} from "./user-store.js";

import {
  createSession,
} from "./session-create.js";

import {
  verifyPassword,
} from "./password-hash.js";

function json(
  data,
  status = 200,
  headers = {}
) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        "Content-Type":
          "application/json",

        "Cache-Control":
          "no-store",

        ...headers,
      },
    }
  );
}

function safeEqual(
  left,
  right
) {
  if (
    typeof left !== "string" ||
    typeof right !== "string"
  ) {
    return false;
  }

  if (
    left.length !==
    right.length
  ) {
    return false;
  }

  let difference = 0;

  for (
    let index = 0;
    index < left.length;
    index += 1
  ) {
    difference |=
      left.charCodeAt(index) ^
      right.charCodeAt(index);
  }

  return difference === 0;
}

async function hashExistingPasswordRecord(
  email,
  password,
  iterations
) {
  const encoder =
    new TextEncoder();

  const keyMaterial =
    await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveBits"]
    );

  const bits =
    await crypto.subtle.deriveBits(
      {
        name:
          "PBKDF2",

        salt:
          encoder.encode(
            normalizeEmail(email)
          ),

        iterations,

        hash:
          "SHA-256",
      },

      keyMaterial,

      256
    );

  return [
    ...new Uint8Array(bits),
  ]
    .map(
      (byte) =>
        byte
          .toString(16)
          .padStart(2, "0")
    )
    .join("");
}

async function verifyStoredPassword(
  email,
  password,
  user
) {
  if (
    user?.passwordRecord &&
    typeof user.passwordRecord ===
      "object"
  ) {
    return verifyPassword(
      password,
      user.passwordRecord
    );
  }

  const storedHash =
    String(
      user?.passwordHash ||
      user?.password_hash ||
      ""
    ).trim();

  if (!storedHash) {
    return false;
  }

  const storedIterations =
    Number(
      user?.password_hash_iterations ||
      100000
    );

  if (
    !Number.isInteger(
      storedIterations
    ) ||
    storedIterations <= 0
  ) {
    return false;
  }

  const suppliedHash =
    await hashExistingPasswordRecord(
      email,
      password,
      storedIterations
    );

  return safeEqual(
    suppliedHash,
    storedHash
  );
}

export async function onRequestPost(
  context
) {
  const {
    request,
    env,
  } = context;

  try {
    const body =
      await request
        .json()
        .catch(() => null);

    const email =
      normalizeEmail(
        body?.email
      );

    const password =
      String(
        body?.password ||
        ""
      );

    if (
      !email ||
      !password
    ) {
      return json(
        {
          success: false,
          error:
            "missing_credentials",
        },
        400
      );
    }

    const user =
      await getUserRecord(
        env,
        email
      );

    if (!user) {
      return json(
        {
          success: false,
          error:
            "account_not_found",
        },
        404
      );
    }

    const hasCanonicalPassword =
      user.passwordRecord &&
      typeof user.passwordRecord ===
        "object";

    const hasExistingPassword =
      Boolean(
        String(
          user.passwordHash ||
          user.password_hash ||
          ""
        ).trim()
      );

    if (
      !hasCanonicalPassword &&
      !hasExistingPassword
    ) {
      return json(
        {
          success: false,
          error:
            "password_not_set",
        },
        403
      );
    }

    const passwordMatches =
      await verifyStoredPassword(
        email,
        password,
        user
      );

    if (!passwordMatches) {
      return json(
        {
          success: false,
          error:
            "invalid_credentials",
        },
        401
      );
    }

    const identityActiveId =
      String(
        user[
          "identity-active-id"
        ] ||
        user.identity_active_id ||
        user.identity_id ||
        user.identityId ||
        ""
      ).trim();

    if (!identityActiveId) {
      return json(
        {
          success: false,
          error:
            "identity_active_id_missing",
        },
        500
      );
    }

    const session =
      await createSession(
        env,
        identityActiveId,
        {
          email:
            user.email ||
            email,

          band:
            "user",
        }
      );

    return json(
      {
        success: true,

        identity_active_id:
          identityActiveId,

        redirect:
          "/dashboard-surface.html",
      },
      200,
      {
        "Set-Cookie":
          session.cookie,
      }
    );
  } catch (error) {
    return json(
      {
        success: false,

        error:
          "login_failed",

        message:
          error instanceof Error
            ? error.message
            : "Unknown login error.",
      },
      500
    );
  }
}
