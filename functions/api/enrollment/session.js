const COOKIE_NAME = "cc_access";

function textEncoder() {
  return new TextEncoder();
}

function textDecoder() {
  return new TextDecoder();
}

function base64UrlDecodeBytes(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(normalized + padding);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

function timingSafeEqualBytes(a, b) {
  if (!a || !b || a.length !== b.length) {
    return false;
  }

  let diff = 0;

  for (let i = 0; i < a.length; i += 1) {
    diff |= a[i] ^ b[i];
  }

  return diff === 0;
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

async function verifySignedToken(token, secret) {
  if (!token || !secret) {
    return null;
  }

  const parts = token.split(".");

  if (parts.length !== 2) {
    return null;
  }

  const payloadPart = parts[0];
  const signaturePart = parts[1];

  const expectedSignature = await signPayloadPart(payloadPart, secret);
  const actualSignature = base64UrlDecodeBytes(signaturePart);

  if (!timingSafeEqualBytes(expectedSignature, actualSignature)) {
    return null;
  }

  try {
    const payloadJson = textDecoder().decode(base64UrlDecodeBytes(payloadPart));
    return JSON.parse(payloadJson);
  } catch (error) {
    return null;
  }
}

function getCookie(request, name) {
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = cookieHeader.split(";");

  for (const cookie of cookies) {
    const trimmed = cookie.trim();
    const equalsIndex = trimmed.indexOf("=");

    if (equalsIndex === -1) {
      continue;
    }

    const cookieName = trimmed.slice(0, equalsIndex);
    const cookieValue = trimmed.slice(equalsIndex + 1);

    if (cookieName === name) {
      return decodeURIComponent(cookieValue);
    }
  }

  return "";
}

function jsonResponse(payload, status) {
  return Response.json(
    payload,
    {
      status,
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}

export async function onRequestGet(context) {
  const request = context.request;
  const env = context.env;

  const secret = env.CC_SESSION_SECRET || "";

  if (!secret) {
    return jsonResponse(
      {
        success: true,
        verified: false,
        email: null,
        enrollmentId: null,
        tier: null,
        expiresAt: null,
        status: "session_secret_missing"
      },
      200
    );
  }

  const cookieValue = getCookie(request, COOKIE_NAME);
  const payload = await verifySignedToken(cookieValue, secret);

  if (!payload) {
    return jsonResponse(
      {
        success: true,
        verified: false,
        email: null,
        enrollmentId: null,
        tier: null,
        expiresAt: null,
        status: "no_verified_session"
      },
      200
    );
  }

  const now = Math.floor(Date.now() / 1000);

  if (payload.type !== "session") {
    return jsonResponse(
      {
        success: true,
        verified: false,
        email: payload.email || null,
        enrollmentId: payload.enrollmentId || null,
        tier: payload.tier || null,
        expiresAt: payload.exp || null,
        status: "invalid_session_type"
      },
      200
    );
  }

  if (!payload.email || !payload.exp || payload.exp <= now) {
    return jsonResponse(
      {
        success: true,
        verified: false,
        email: payload.email || null,
        enrollmentId: payload.enrollmentId || null,
        tier: payload.tier || null,
        expiresAt: payload.exp || null,
        status: "session_expired_or_invalid"
      },
      200
    );
  }

  return jsonResponse(
    {
      success: true,
      verified: true,
      email: payload.email,
      enrollmentId: payload.enrollmentId || null,
      tier: payload.tier || "visitor",
      expiresAt: payload.exp,
      status: "verified_session_active"
    },
    200
  );
}
