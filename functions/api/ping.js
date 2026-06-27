/**
 * functions/api/ping.js
 *
 * CyberCrowd PING Intake
 *
 * ONE JOB:
 * Create a real server-side PING from a verified CyberCrowd session.
 *
 * This is NOT a test.
 * This is NOT chat.
 * This is NOT email.
 * This is NOT search.
 *
 * PING means:
 * relevant movement from one verified identity to another,
 * usually caused by I CAN evidence, object availability,
 * human selection, proximity, or SYNC movement.
 */

const PING_TTL_SECONDS = 60 * 60 * 24 * 30;
const INDEX_TTL_SECONDS = 60 * 60 * 24 * 90;
const MAX_INDEX_ITEMS = 100;

const ALLOWED_KINDS = new Set([
  "proximity_match",
  "human_selection",
  "service_request",
  "proof_sync",
  "assisted_presence"
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

  const body = await readJson(request);

  if (!body) {
    return json({
      ok: false,
      error: "JSON_REQUIRED"
    }, 400);
  }

  const fromIdentityId = cleanText(
    session.identity_id ||
    session.identityId ||
    session.idl ||
    session.email
  );

  if (!fromIdentityId) {
    return json({
      ok: false,
      error: "SESSION_IDENTITY_MISSING"
    }, 401);
  }

  const toIdentityId = cleanText(
    body.to_identity_id ||
    body.toIdentityId ||
    body.target_identity_id ||
    body.targetIdentityId
  );

  if (!toIdentityId) {
    return json({
      ok: false,
      error: "TARGET_IDENTITY_REQUIRED"
    }, 400);
  }

  const kind = cleanText(body.kind) || "human_selection";

  if (!ALLOWED_KINDS.has(kind)) {
    return json({
      ok: false,
      error: "PING_KIND_NOT_ALLOWED"
    }, 400);
  }

  if (
    fromIdentityId === toIdentityId &&
    kind !== "proof_sync" &&
    kind !== "assisted_presence"
  ) {
    return json({
      ok: false,
      error: "SELF_PING_BLOCKED"
    }, 400);
  }

  const now = new Date().toISOString();
  const pingId = makeId("PING");

  const ping = {
    id: pingId,
    kind,
    free: true,

    from_identity_id: fromIdentityId,
    to_identity_id: toIdentityId,

    object_id: cleanText(body.object_id || body.objectId) || null,
    intent_id: cleanText(body.intent_id || body.intentId) || null,

    reason: cleanText(body.reason) || "Relevant CyberCrowd movement",
    surface: cleanText(body.surface || body.magic_cursor_surface) || null,

    status: "queued",
    created_at: now,
    updated_at: now,

    metadata: cleanMetadata(body.metadata)
  };

  await env.IDENTITY.put(
    "ping:" + ping.id,
    JSON.stringify(ping),
    {
      expirationTtl: PING_TTL_SECONDS
    }
  );

  await appendIndex(env, "ping:index:from:" + fromIdentityId, ping.id);
  await appendIndex(env, "ping:index:to:" + toIdentityId, ping.id);

  await appendSync(env, ping.id, {
    type: "ping_created",
    ping_id: ping.id,
    kind: ping.kind,
    from_identity_id: ping.from_identity_id,
    to_identity_id: ping.to_identity_id,
    object_id: ping.object_id,
    intent_id: ping.intent_id,
    at: now
  });

  await appendSync(env, fromIdentityId, {
    type: "ping_sent",
    ping_id: ping.id,
    to_identity_id: ping.to_identity_id,
    object_id: ping.object_id,
    at: now
  });

  await appendSync(env, toIdentityId, {
    type: "ping_received",
    ping_id: ping.id,
    from_identity_id: ping.from_identity_id,
    object_id: ping.object_id,
    at: now
  });

  if (ping.object_id) {
    await appendSync(env, ping.object_id, {
      type: "object_pinged",
      ping_id: ping.id,
      from_identity_id: ping.from_identity_id,
      to_identity_id: ping.to_identity_id,
      at: now
    });
  }

  if (ping.intent_id) {
    await appendSync(env, ping.intent_id, {
      type: "intent_pinged",
      ping_id: ping.id,
      object_id: ping.object_id,
      at: now
    });
  }

  return json({
    ok: true,
    ping_id: ping.id,
    status: ping.status,
    free: ping.free,
    kind: ping.kind,
    from_identity_id: ping.from_identity_id,
    to_identity_id: ping.to_identity_id,
    object_id: ping.object_id,
    intent_id: ping.intent_id,
    surface: ping.surface,
    reason: ping.reason
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

async function appendIndex(env, key, value) {
  const raw = await env.IDENTITY.get(key);

  let list = [];

  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        list = parsed;
      }
    } catch {
      list = [];
    }
  }

  list = list.filter((item) => item !== value);
  list.unshift(value);
  list = list.slice(0, MAX_INDEX_ITEMS);

  await env.IDENTITY.put(
    key,
    JSON.stringify(list),
    {
      expirationTtl: INDEX_TTL_SECONDS
    }
  );
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

  trail = trail.slice(0, MAX_INDEX_ITEMS);

  await env.IDENTITY.put(
    key,
    JSON.stringify(trail),
    {
      expirationTtl: INDEX_TTL_SECONDS
    }
  );
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
