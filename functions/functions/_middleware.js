const COOKIE_NAME = "cc_access";

function textEncoder() {
  return new TextEncoder();
}

function textDecoder() {
  return new TextDecoder();
}

function base64UrlDecodeBytes(value) {
  const padded =
    value.replace(/-/g, "+").replace(/_/g, "/") +
    "===".slice((value.length + 3) % 4);

  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

async function signPayloadPart(payloadPart, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
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
  if (!a || !b || a.length !== b.length) return false;

  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

async function verifySignedToken(token, secret) {
  if (!token || !secret) return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

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
  } catch {
    return null;
  }
}

function sanitizeNext(value) {
  if (!value) return "/";

  const raw = String(value).trim();

  if (!raw.startsWith("/")) return "/";
  if (raw.startsWith("//")) return "/";

  try {
    const parsed = new URL(raw, "https://cybercrowd.net");
    const safe = parsed.pathname + parsed.search + parsed.hash;

    if (safe.startsWith("/api/")) return "/";
    if (safe === "/verify-success.html") return "/verify-success.html";

    return safe;
  } catch {
    return "/";
  }
}

export async function onRequest(context) {
  const request = context.request;
  const env = context.env;
  const url = new URL(request.url);
  const path = url.pathname;

  // ACP + x402 logic stays untouched
  if (path.includes("_60s.teaser.mp3")) return context.next();
  if (path === "/.well-known/acp.json") return context.next();
  if (path === "/.well-known/x402") return context.next();
  if (path.startsWith("/api/album/")) return context.next();

  // Public routes
  const publicRoutes = [
    "/",
    "/index.html",
    "/page2.html",
    "/verify-success.html",
    "/api/enrollment/start",
    "/api/enrollment/verify"
  ];

  if (publicRoutes.includes(path)) {
    return context.next();
  }

  // Check session cookie
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map(v => {
      const [k, ...rest] = v.trim().split("=");
      return [k, rest.join("=")];
    })
  );

  const sessionToken = cookies[COOKIE_NAME];
  const secret = env.CC_SESSION_SECRET || "";

  if (!sessionToken || !secret) {
    const redirectUrl = "/page2.html?next=" + encodeURIComponent(path);
    return Response.redirect(redirectUrl, 302);
  }

  const session = await verifySignedToken(sessionToken, secret);

  if (!session || session.type !== "session") {
    const redirectUrl = "/page2.html?next=" + encodeURIComponent(path);
    return Response.redirect(redirectUrl, 302);
  }

  const now = Math.floor(Date.now() / 1000);
  if (!session.exp || session.exp <= now) {
    const redirectUrl = "/page2.html?next=" + encodeURIComponent(path);
    return Response.redirect(redirectUrl, 302);
  }

  // Session valid → allow access
  return context.next();
}
