/**
 * NET FILE: functions/access/classify.js
 * Repository: cybercrowd99/cybercrowd-net
 * Title: CyberCrowd Access Signal Classifier
 *
 * Purpose:
 * Classify which access signal is present on an incoming request.
 *
 * Owns:
 * Access-signal presence classification and diagnostic response.
 *
 * Does NOT own:
 * Authentication, token validation, authorization decisions,
 * session creation, account lookup, identity storage, or admin access.
 */

export async function onRequest(context) {
  const request = context.request;
  const headers = request.headers;

  const authorization = headers.get("authorization") || null;
  const accessToken = headers.get("x-access-token") || null;
  const cloudflareAccess =
    headers.get("cf-access-jwt-assertion") || null;

  const cookieHeader = headers.get("cookie") || "";
  const cookies = parseCookies(cookieHeader);
  const cybercrowdAccess = cookies.cc_access || null;

  let accessLevel = "anonymous";

  if (authorization) {
    accessLevel = "bearer";
  } else if (accessToken) {
    accessLevel = "access-token";
  } else if (cloudflareAccess) {
    accessLevel = "cloudflare-access";
  } else if (cybercrowdAccess) {
    accessLevel = "cybercrowd-token";
  } else if (Object.keys(cookies).length > 0) {
    accessLevel = "session-cookie";
  }

  return jsonResponse({
    classified: true,
    accessLevel,
    signals: {
      authorization: Boolean(authorization),
      accessToken: Boolean(accessToken),
      cloudflareAccess: Boolean(cloudflareAccess),
      cybercrowdToken: Boolean(cybercrowdAccess),
      hasCookies: Object.keys(cookies).length > 0
    }
  });
}

function parseCookies(cookieHeader) {
  const cookies = {};

  for (const entry of cookieHeader.split(";")) {
    const trimmed = entry.trim();

    if (!trimmed) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex <= 0) {
      continue;
    }

    const name = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1);

    if (name) {
      cookies[name] = value;
    }
  }

  return cookies;
}

function jsonResponse(data) {
  return new Response(JSON.stringify(data, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}
