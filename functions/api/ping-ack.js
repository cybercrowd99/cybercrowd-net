/**
 * functions/api/ping-ack.js
 *
 * CyberCrowd PING Acknowledgement
 *
 * ONE JOB:
 * Let a verified identity act on a PING.
 *
 * This is NOT chat.
 * This is NOT email.
 * This is NOT a notification system.
 * This is the moment where relevant movement gets a human response.
 */

const INDEX_TTL_SECONDS = 60 * 60 * 24 * 90;
const MAX_SYNC_ITEMS = 100;

const ALLOWED_ACTIONS = new Set([
  "seen",
  "saved",
  "ignored",
  "accepted",
  "investigate",
  "resolved"
]);

export async function onRequestOptions() {
  return json({
    ok: true
  });
}

export async function onRequestPost(context) {
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

  const body = await readJson(request);

  if (!body) {
    return json({
      ok: false,
      error: "JSON_REQUIRED"
    }, 400);
  }

  const pingId = cleanText(
    body.ping_id ||
    body.pingId ||
    body.id
  );

  if (!pingId) {
    return json({
      ok: false,
      error: "PING_ID_REQUIRED"
    }, 400);
  }

  const action = cleanText(body.action || body.status).toLowerCase();

  if (!ALLOWED_ACTIONS.has(action)) {
    return json({
      ok: false,
      error: "PING_ACTION_NOT_ALLOWED",
      allowed: Array.from(ALLOWED_ACTIONS)
    }, 400);
  }

  const ping = await readPing(env, pingId);

  if (!ping) {
    return json({
      ok: false,
      error: "PING_NOT_FOUND"
    }, 404);
  }

  const isReceiver = ping.to_identity_id === identityId;
  const isSender = ping.from_identity_id === identityId;

  if (!isReceiver && !isSender) {
    return json({
      ok: false,
      error: "PING_ACCESS_DENIED"
    }, 403);
  }

  if (!isReceiver && action !== "seen") {
    return json({
      ok: false,
      error: "ONLY_RECEIVER_CAN_ACT_ON_PING"
    }, 403);
  }

  const now = new Date().toISOString();

  ping.status = action;
  ping.updated_at = now;
  ping.acted_at = now;
  ping.acted_by_identity_id = identityId;

  ping.action_note = cleanText(body.note) || null;
  ping.action_metadata = cleanMetadata(body.metadata);

  await env.IDENTITY.put(
    "ping:" + ping.id,
    JSON.stringify(ping),
    {
      expirationTtl: INDEX_TTL_SECONDS
    }
  );

  await appendSync(env, ping.id, {
    type: "ping_acknowledged",
    ping_id: ping.id,
    action,
    identity_id: identityId,
    at: now
  });

  await appendSync(env, identityId, {
    type: "ping_action_taken",
    ping_id: ping.id,
    action,
    other_identity_id: isReceiver ? ping.from_identity_id : ping.to_identity_id,
    object_id: ping.object_id || null,
    intent_id: ping.intent_id || null,
    at: now
  });

  if (ping.from_identity_id) {
    await appendSync(env, ping.from_identity_id, {
      type: "ping_status_changed",
      ping_id: ping.id,
      action,
      acted_by_identity_id: identityId,
      at: now
    });
  }

  if (ping.object_id) {
    await appendSync(env, ping.object_id, {
      type: "object_ping_action",
      ping_id: ping.id,
      action,
      acted_by_identity_id: identityId,
      at: now
    });
  }

  if (ping.intent_id) {
    await appendSync(env, ping.intent_id, {
      type: "intent_ping_action",
      ping_id: ping.id,
      action,
      acted_by_identity_id: identityId,
      at: now
    });
  }

  return json({
    ok: true,
    ping_id: ping.id,
    status: ping.status,
    action,
    acted_by_identity_id: identityId,
    acted_at: ping.acted_at
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

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
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

async function appendSync(env, targetId, event) {
  const key = "sync:" + targetId;
  const raw = await env.IDENTITY.get(key);

  let trail = [];

  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        trail = parsed;
      }
    } catch {
      trail = [];
    }
  }

  trail.unshift({
    sync_id: makeId("SYNC"),
    ...event
  });

  trail = trail.slice(0, MAX_SYNC_ITEMS);

  await env.IDENTITY.put(
    key,
    JSON.stringify(trail),
    {
      expirationTtl: INDEX_TTL_SECONDS
    }
  );
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

function makeId(prefix) {
  if (crypto && crypto.randomUUID) {
    return prefix + "." + crypto.randomUUID();
  }

  return prefix + "." + Date.now() + "." + Math.random().toString(36).slice(2, 10);
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
