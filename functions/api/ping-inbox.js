/**
 * functions/api/ping-inbox.js
 *
 * CyberCrowd PING Inbox
 *
 * ONE JOB:
 * Show a verified identity the PINGs waiting for them.
 *
 * This is NOT a test.
 * This is NOT a demo.
 * This is NOT email.
 * This is NOT chat.
 * This is NOT notification spam.
 *
 * PING inbox means:
 * "What relevant movement is waiting for this verified identity?"
 */

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

export async function onRequestOptions() {
  return json({
    ok: true
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;

  if (!env || !env.IDENTITY) {
    return json({
      ok: false,
      error: "IDENTITY_KV_MISSING"
    }, 500);
  }

  const session = await readVerifiedSession(request, env);

  if (!session) {
    return json({
      ok: false,
      error: "SESSION_REQUIRED"
    }, 401);
  }

  const identityId = cleanText(
    session.identity_id ||
    session.identityId ||
    session.idl ||
    session.email
  );

  if (!identityId) {
    return json({
      ok: false,
      error: "SESSION_IDENTITY_MISSING"
    }, 401);
  }

  const url = new URL(request.url);
  const limit = clampLimit(url.searchParams.get("limit"));
  const includeResolved = url.searchParams.get("include_resolved") === "true";

  const indexKey = "ping:index:to:" + identityId;
  const ids = await readIndex(env, indexKey);

  const inbox = [];

  for (const pingId of ids) {
    if (inbox.length >= limit) break;

    const ping = await readPing(env, pingId);

    if (!ping) continue;

    if (ping.to_identity_id !== identityId) continue;

    if (!includeResolved && isResolved(ping.status)) continue;

    inbox.push(cleanPingForInbox(ping));
  }

  return json({
    ok: true,
    identity_id: identityId,
    count: inbox.length,
    pings: inbox
  });
}

async function readVerifiedSession(request, env) {
  const token =
    getCookie(request, "session") ||
    getCookie(request, "cc_session") ||
    getBearerToken(request);

  if (!token) {
    return null;
  }

  const raw = await env.IDENTITY.get("session:" + token);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function readIndex(env, key) {
  const raw = await env.IDENTITY.get(key);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed)) {
      return parsed.filter((item) => typeof item === "string" && item.trim());
    }

    return [];
  } catch {
    return [];
  }
}

async function readPing(env, pingId) {
  const raw = await env.IDENTITY.get("ping:" + pingId);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function cleanPingForInbox(ping) {
  return {
    id: ping.id,
    kind: ping.kind,
    free: ping.free === true,

    from_identity_id: ping.from_identity_id,
    to_identity_id: ping.to_identity_id,

    object_id: ping.object_id || null,
    intent_id: ping.intent_id || null,

    reason: ping.reason || "Relevant CyberCrowd movement",
    surface: ping.surface || null,

    status: ping.status || "queued",
    created_at: ping.created_at || null,
    updated_at: ping.updated_at || null,

    metadata: cleanMetadata(ping.metadata)
  };
}

function isResolved(status) {
  const value = cleanText(status).toLowerCase();

  return (
    value === "seen" ||
    value === "saved" ||
    value === "ignored" ||
    value === "accepted" ||
    value === "resolved" ||
    value === "deleted"
  );
}

function clampLimit(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return DEFAULT_LIMIT;
  }

  if (number < 1) {
    return 1;
  }

  if (number > MAX_LIMIT) {
    return MAX_LIMIT;
  }

  return Math.floor(number);
}

function getCookie(request, name) {
  const header = request.headers.get("Cookie") || "";
  const parts = header.split(";");

  for (const part of parts) {
    const index = part.indexOf("=");

    if (index === -1) continue;

    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();

    if (key === name) {
      return decodeURIComponent(value);
    }
  }

  return "";
}

function getBearerToken(request) {
  const header = request.headers.get("Authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return "";
  }

  return match[1].trim();
}

function cleanText(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function cleanMetadata(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const cleaned = {};

  Object.keys(value).forEach((key) => {
    const lower = key.toLowerCase();

    if (
      lower.includes("password") ||
      lower.includes("secret") ||
      lower.includes("token") ||
      lower.includes("cookie")
    ) {
      return;
    }

    const item = value[key];

    if (
      typeof item === "string" ||
      typeof item === "number" ||
      typeof item === "boolean" ||
      item === null
    ) {
      cleaned[key] = item;
    }
  });

  return cleaned;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}
