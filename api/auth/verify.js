const COOKIE_NAME = "cc_access";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function textEncoder() {
  return new TextEncoder();
}

function textDecoder() {
  return new TextDecoder();
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

function base64UrlDecodeBytes(value) {
  const padded =
    value.replace(/-/g, "+").replace(/_/g, "/") +
    "===".slice((value.length + 3) % 4);

  const binary = atob(padded);
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
    [
      "sign"
    ]
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

function sanitizeNext(value) {
  if (!value) {
    return "/";
  }

  const raw = String(value).trim();

  if (!raw.startsWith("/")) {
    return "/";
  }

  if (raw.startsWith("//")) {
    return "/";
  }

  try {
    const parsed = new URL(raw, "https://cybercrowd.net");
    const safe = parsed.pathname + parsed.search + parsed.hash;

    if (safe === "/page2.html" || safe.startsWith("/page2.html?verified=1")) {
      return "/";
    }

    return safe;
  } catch (error) {
    return "/";
  }
}

function makeAccessCookie(sessionToken) {
  return [
    COOKIE_NAME + "=" + sessionToken,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    "Max-Age=" + SESSION_MAX_AGE_SECONDS
  ].join("; ");
}

function plainText(message, status) {
  return new Response(
    message,
    {
      status,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store"
      }
    }
  );
}

export async function onRequestGet(context) {
  try {
    const request = context.request;
    const env = context.env;
    const url = new URL(request.url);

    const token = url.searchParams.get("token") || "";
    const secret = env.CC_SESSION_SECRET || "";

    if (!secret) {
      return plainText(
        "CyberCrowd verification is missing CC_SESSION_SECRET.",
        500
      );
    }

    if (!token) {
      return plainText(
        "Missing verification token.",
        400
      );
    }

    const verifyPayload = await verifySignedToken(token, secret);

    if (!verifyPayload) {
      return plainText(
        "Invalid verification token.",
        400
      );
    }

    const now = Math.floor(Date.now() / 1000);

    if (verifyPayload.type !== "verify") {
      return plainText(
        "Invalid verification token type.",
        400
      );
    }

    if (!verifyPayload.email) {
      return plainText(
        "Verification token is missing email.",
        400
      );
    }

    if (!verifyPayload.exp || verifyPayload.exp <= now) {
      return plainText(
        "Verification link expired. Request a new link.",
        410
      );
    }

    const next = sanitizeNext(verifyPayload.next || "/");

    const sessionToken = await createSignedToken(
      {
        type: "session",
        email: verifyPayload.email,
        next,
        iat: now,
        exp: now + SESSION_MAX_AGE_SECONDS
      },
      secret
    );

    const successUrl = new URL("/verify-success.html", url.origin);

    successUrl.searchParams.set("verified", "1");
    successUrl.searchParams.set("email", verifyPayload.email);
    successUrl.searchParams.set("next", next);

    console.log("CYBERCROWD EMAIL LINK VERIFIED:", {
      email: verifyPayload.email,
      next
    });

    return new Response(
      null,
      {
        status: 302,
        headers: {
          "Location": successUrl.toString(),
          "Set-Cookie": makeAccessCookie(sessionToken),
          "Cache-Control": "no-store"
        }
      }
    );
  } catch (error) {
    console.error("CYBERCROWD VERIFY ERROR:", error);

    return plainText(
      "Verification failure.",
      500
    );
  }
}
