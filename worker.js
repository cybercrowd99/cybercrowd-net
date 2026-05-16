import { onRequestPost as signupPost } from "./api/auth/signup.js";
import { onRequestGet as verifyGet } from "./api/auth/verify.js";
import {
  onRequestGet as smokeGet,
  onRequestPost as smokePost
} from "./api/email/smoke.js";

const COOKIE_NAME = "cc_access";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const PUBLIC_EXACT_PATHS = new Set([
  "/",
  "/index.html",
  "/page2.html",
  "/email-smoke.html",
  "/verify-success.html",
  "/robots.txt",
  "/sitemap.xml",
  "/favicon.ico"
]);

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
      return cookieValue;
    }
  }

  return "";
}

function makeClearCookie() {
  return [
    COOKIE_NAME + "=",
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    "Max-Age=0"
  ].join("; ");
}

async function getVerifiedSession(request, env) {
  const secret = env.CC_SESSION_SECRET || "";
  const cookieValue = getCookie(request, COOKIE_NAME);

  const payload = await verifySignedToken(cookieValue, secret);

  if (!payload) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);

  if (payload.type !== "session") {
    return null;
  }

  if (!payload.email) {
    return null;
  }

  if (!payload.exp || payload.exp <= now) {
    return null;
  }

  return payload;
}

function isAssetPath(path) {
  if (path.startsWith("/assets/")) {
    return true;
  }

  if (path.startsWith("/images/")) {
    return true;
  }

  if (path.startsWith("/image/")) {
    return true;
  }

  if (path.startsWith("/img/")) {
    return true;
  }

  if (path.startsWith("/audio/")) {
    return true;
  }

  if (path.startsWith("/media/")) {
    return true;
  }

  if (path.startsWith("/css/")) {
    return true;
  }

  if (path.startsWith("/js/")) {
    return true;
  }

  return /\.(css|js|mjs|png|jpg|jpeg|gif|webp|svg|ico|mp3|wav|ogg|mp4|webm|woff|woff2|ttf|otf|json|txt|xml|pdf)$/i.test(path);
}

function isApiPath(path) {
  return path.startsWith("/api/");
}

function isPublicPath(path) {
  if (PUBLIC_EXACT_PATHS.has(path)) {
    return true;
  }

  if (isApiPath(path)) {
    return true;
  }

  if (isAssetPath(path)) {
    return true;
  }

  return false;
}

function isProtectedHtmlPath(path) {
  if (!path.endsWith(".html")) {
    return false;
  }

  return !isPublicPath(path);
}

function makeRedirectToGate(requestUrl) {
  const gateUrl = new URL("/page2.html", requestUrl.origin);

  gateUrl.searchParams.set(
    "next",
    requestUrl.pathname + requestUrl.search
  );

  return Response.redirect(gateUrl.toString(), 302);
}

async function assetFetch(request, env) {
  if (!env.ASSETS || typeof env.ASSETS.fetch !== "function") {
    return new Response(
      "CyberCrowd ASSETS binding is missing.",
      {
        status: 500,
        headers: {
          "Content-Type": "text/plain; charset=utf-8"
        }
      }
    );
  }

  return env.ASSETS.fetch(request);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/api/enrollment/start" && request.method === "POST") {
      return signupPost({
        request,
        env,
        ctx
      });
    }

    if (path === "/api/auth/signup" && request.method === "POST") {
      return signupPost({
        request,
        env,
        ctx
      });
    }

    if (path === "/api/enrollment/verify" && request.method === "GET") {
      return verifyGet({
        request,
        env,
        ctx
      });
    }

    if (path === "/api/auth/verify" && request.method === "GET") {
      return verifyGet({
        request,
        env,
        ctx
      });
    }

    if (path === "/api/email/smoke" && request.method === "GET") {
      return smokeGet({
        request,
        env,
        ctx
      });
    }

    if (path === "/api/email/smoke" && request.method === "POST") {
      return smokePost({
        request,
        env,
        ctx
      });
    }

    if (path === "/api/email/smoke") {
      return Response.json(
        {
          success: false,
          status: "method_not_allowed",
          allowed: [
            "GET",
            "POST"
          ]
        },
        {
          status: 405,
          headers: {
            "Cache-Control": "no-store"
          }
        }
      );
    }

    if (path === "/api/enrollment/session" && request.method === "GET") {
      const session = await getVerifiedSession(request, env);

      return Response.json(
        {
          success: true,
          verified: Boolean(session),
          email: session ? session.email : null,
          expiresAt: session ? session.exp : null
        },
        {
          headers: {
            "Cache-Control": "no-store"
          }
        }
      );
    }

    if (path === "/api/enrollment/close") {
      return new Response(
        "CyberCrowd access closed.",
        {
          status: 302,
          headers: {
            "Location": "/",
            "Set-Cookie": makeClearCookie(),
            "Cache-Control": "no-store",
            "Content-Type": "text/plain; charset=utf-8"
          }
        }
      );
    }

    if (path === "/api/enrollment/status") {
      const session = await getVerifiedSession(request, env);

      return Response.json(
        {
          success: true,
          route_status: "active",
          worker_authority: true,
          send_route: "/api/enrollment/start",
          verify_route: "/api/enrollment/verify",
          session_route: "/api/enrollment/session",
          close_route: "/api/enrollment/close",
          smoke_route: "/api/email/smoke",
          verified: Boolean(session),
          protected_html_rule: "any non-public .html page requires verified cookie",
          assets_fallback: true
        },
        {
          headers: {
            "Cache-Control": "no-store"
          }
        }
      );
    }

    if (isProtectedHtmlPath(path)) {
      const session = await getVerifiedSession(request, env);

      if (!session) {
        return makeRedirectToGate(url);
      }

      return assetFetch(request, env);
    }

    return assetFetch(request, env);
  }
};
