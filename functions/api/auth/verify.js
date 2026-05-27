const COOKIE_NAME = "cc_access";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function textEncoder() {
  return new TextEncoder();
}

function base64UrlEncodeBytes(bytes) {
  let binary = "";

  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function signPayloadPart(payloadPart, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder().encode(secret),
    {
      name: "HMAC",
      hash: "SHA-256"
    },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    textEncoder().encode(payloadPart)
  );

  return new Uint8Array(signature);
}

async function createSignedToken(payload, secret) {
  const payloadJson = JSON.stringify(payload);
  const payloadPart = base64UrlEncodeBytes(textEncoder().encode(payloadJson));
  const signatureBytes = await signPayloadPart(payloadPart, secret);
  const signaturePart = base64UrlEncodeBytes(signatureBytes);

  return payloadPart + "." + signaturePart;
}

function makeAccessCookie(sessionToken) {
  return [
    COOKIE_NAME + "=" + encodeURIComponent(sessionToken),
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    "Max-Age=" + SESSION_MAX_AGE_SECONDS
  ].join("; ");
}

function plainText(message, status) {
  return new Response(message, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function sanitizeEmail(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

// Preserve your 3-tier economy exactly
function sanitizeTier(value) {
  const tier = String(value || "").trim();

  if (tier === "free" || tier === "member" || tier === "creator") {
    return tier;
  }

  return "free";
}

// No more nav.html or legacy blocking
function sanitizeNext(value) {
  const raw = String(value || "/dashboard-surface.html").trim();

  if (!raw.startsWith("/") || raw.startsWith("//")) {
    return "/dashboard-surface.html";
  }

  return raw;
}

export async function onRequestGet(context) {
  try {
    const request = context.request;
    const env = context.env;
    const url = new URL(request.url);

    const secret = env.CC_SESSION_SECRET || "";

    if (!secret) {
      return plainText(
        "CyberCrowd verification is missing CC_SESSION_SECRET.",
        500
      );
    }

    const enrollmentId =
      url.searchParams.get("enrollment") ||
      url.searchParams.get("enrollment_id") ||
      "";

    const legacyToken =
      url.searchParams.get("token") ||
      "";

    const email = sanitizeEmail(
      url.searchParams.get("email") || ""
    );

    let tier = sanitizeTier(
      url.searchParams.get("tier") || ""
    );

    if (!email) {
      return plainText("Missing verification email.", 400);
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      return plainText("Invalid verification email.", 400);
    }

    if (!enrollmentId && !legacyToken) {
      return plainText(
        "Missing verification enrollment or token.",
        400
      );
    }

    if (enrollmentId) {
      const enrollmentDb = env.ENROLLMENT_DB;

      if (!enrollmentDb) {
        return plainText(
          "Enrollment database binding ENROLLMENT_DB is missing.",
          500
        );
      }

      const record = await enrollmentDb
        .prepare(
          `SELECT enrollment_id, email, tier, status
           FROM enrollments
           WHERE enrollment_id = ?`
        )
        .bind(enrollmentId)
        .first();

      if (!record) {
        return plainText("Enrollment record not found.", 404);
      }

      if (sanitizeEmail(record.email) !== email) {
        return plainText("Enrollment email mismatch.", 400);
      }

      if (record.tier) {
        tier = sanitizeTier(record.tier);
      }

      await enrollmentDb
        .prepare(
          `UPDATE enrollments
           SET
             status = ?,
             updated_at = CURRENT_TIMESTAMP
           WHERE enrollment_id = ?`
        )
        .bind(
          "verified_access_granted",
          enrollmentId
        )
        .run();
    }

    const now = Math.floor(Date.now() / 1000);

    const sessionPayload = {
      type: "session",
      email,
      enrollmentId: enrollmentId || legacyToken,
      tier,
      iat: now,
      exp: now + SESSION_MAX_AGE_SECONDS
    };

    const sessionToken = await createSignedToken(
      sessionPayload,
      secret
    );

    const successUrl = new URL(
      "/verify-success.html",
      url.origin
    );

    successUrl.searchParams.set("verified", "1");
    successUrl.searchParams.set("email", email);
    successUrl.searchParams.set("tier", tier);

    successUrl.searchParams.set(
      "next",
      sanitizeNext("/dashboard-surface.html")
    );

    return new Response(null, {
      status: 302,
      headers: {
        "Location": successUrl.toString(),
        "Set-Cookie": makeAccessCookie(sessionToken),
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    return plainText(
      "Verification failure: " +
        String(error && error.message ? error.message : error),
      500
    );
  }
}
