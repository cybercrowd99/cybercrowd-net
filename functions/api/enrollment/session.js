const COOKIE_NAME = "cc_access";

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

  const token = getCookie(request, COOKIE_NAME);

  if (!token) {
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

  const payload = await verifySignedToken(token, secret);

  if (!payload) {
    return jsonResponse(
      {
        success: true,
        verified: false,
        email: null,
        enrollmentId: null,
        tier: null,
        expiresAt: null,
        status: "invalid_session_token"
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
      issuedAt: payload.iat || null,
      expiresAt: payload.exp,
      status: "verified_session_active"
    },
    200
  );
}

export async function onRequestDelete() {
  return new Response(
    JSON.stringify(
      {
        success: true,
        verified: false,
        status: "session_cleared"
      },
      null,
      2
    ),
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "application/json; charset=utf-8",
        "Set-Cookie": [
          COOKIE_NAME + "=",
          "Path=/",
          "HttpOnly",
          "Secure",
          "SameSite=Lax",
          "Max-Age=0"
        ].join("; ")
      }
    }
  );
}

function jsonResponse(payload, status) {
  return new Response(
    JSON.stringify(payload, null, 2),
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "application/json; charset=utf-8"
      }
    }
  );
}

function getCookie(request, name) {
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = cookieHeader.split(";");

  for (let i = 0; i < cookies.length; i += 1) {
    const part = cookies[i].trim();
    const equalsIndex = part.indexOf("=");

    if (equalsIndex === -1) {
      continue;
    }

    const cookieName = part.slice(0, equalsIndex);
    const cookieValue = part.slice(equalsIndex + 1);

    if (cookieName === name) {
      try {
        return decodeURIComponent(cookieValue);
      } catch (error) {
        return cookieValue;
      }
    }
  }

  return "";
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

  if (!actualSignature) {
    return null;
  }

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

function textEncoder() {
  return new TextEncoder();
}

function textDecoder() {
  return new TextDecoder();
}

function base64UrlDecodeBytes(value) {
  try {
    const normalized = String(value || "")
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
    const binary = atob(normalized + padding);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }

    return bytes;
  } catch (error) {
    return null;
  }
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
