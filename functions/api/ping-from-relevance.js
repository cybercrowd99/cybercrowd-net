/**
 * functions/api/ping-from-relevance.js
 *
 * CyberCrowd PING From Relevance
 *
 * ONE JOB:
 * Create one PING from a confirmed relevance decision.
 *
 * This is NOT relevance checking.
 * This is NOT proximity entry.
 * This is NOT carrier routing.
 * This is NOT delivery.
 * This is NOT chat.
 * This is NOT notification spam.
 *
 * Relevance Check says:
 * this object / shot / intent / field matters.
 *
 * PING From Relevance says:
 * create exactly one movement signal from that decision.
 *
 * Flow:
 * relevance-check.js confirms relevance
 *   ↓
 * ping-from-relevance.js creates one PING
 *   ↓
 * carrier-route.js chooses surface
 *   ↓
 * ping-delivery.js records delivery
 *   ↓
 * ping-ack.js lets identity act
 */

const PING_TTL_SECONDS = 60 * 60 * 24 * 30;
const INDEX_TTL_SECONDS = 60 * 60 * 24 * 90;
const MAX_INDEX_ITEMS = 100;

const ALLOWED_STATUS = new Set([
  "created",
  "queued",
  "routed",
  "delivered",
  "seen",
  "saved",
  "ignored",
  "accepted",
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

  const actorIdentityId = cleanText(
    session.identity_id ||
    session.identityId ||
    session.idl ||
    session.email
  );

  if (!actorIdentityId) {
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

  const relevanceId = cleanText(
    body.relevance_id ||
    body.relevanceId ||
    body.id
  );

  if (!relevanceId) {
    return json({
      ok: false,
      error: "RELEVANCE_ID_REQUIRED"
    }, 400);
  }

  const relevance = await readRelevance(env, relevanceId);

  if (!relevance) {
    return json({
      ok: false,
      error: "RELEVANCE_NOT_FOUND"
    }, 404);
  }

  if (relevance.identity_id !== actorIdentityId) {
    return json({
      ok: false,
      error: "RELEVANCE_ACCESS_DENIED"
    }, 403);
  }

  if (relevance.relevant !== true || relevance.result !== "relevant") {
    return json({
      ok: true,
      created: false,
      error: "RELEVANCE_NOT_CONFIRMED",
      relevance_id: relevance.id,
      result: relevance.result,
      ping_created: false
    });
  }

  const existingPingId = await firstIndexValue(env, "ping:index:relevance:" + relevance.id);

  if (existingPingId) {
    const existingPing = await readPing(env, existingPingId);

    if (existingPing) {
      return json({
        ok: true,
        created: false,
        existing: true,
        ping_id: existingPing.id,
        relevance_id: relevance.id,
        status: existingPing.status,
        ping_created: false,
        reason: "ping_already_exists_for_relevance"
      });
    }
  }

  const object = relevance.object_id
    ? await readObject(env, relevance.object_id)
    : null;

  const shot = relevance.shot_id
    ? await readShot(env, relevance.shot_id)
    : null;

  const intent = relevance.intent_id
    ? await readIntent(env, relevance.intent_id)
    : null;

  const fromIdentityId = cleanText(
    body.from_identity_id ||
    body.fromIdentityId ||
    object?.owner_identity_id ||
    shot?.owner_identity_id ||
    shot?.observer_identity_id ||
    actorIdentityId
  );

  const toIdentityId = actorIdentityId;

  if (!fromIdentityId) {
    return json({
      ok: false,
      error: "PING_FROM_IDENTITY_MISSING"
    }, 500);
  }

  const status = cleanText(body.status || "queued").toLowerCase();

  if (!ALLOWED_STATUS.has(status)) {
    return json({
      ok: false,
      error: "PING_STATUS_NOT_ALLOWED",
      allowed: Array.from(ALLOWED_STATUS)
    }, 400);
  }

  const now = new Date().toISOString();

  const pingId = cleanText(
    body.ping_id ||
    body.pingId
  ) || makeId("PING");

  const ping = {
    id: pingId,
    kind: "proximity_match",
    status,

    from_identity_id: fromIdentityId,
    to_identity_id: toIdentityId,

    relevance_id: relevance.id,
    relevance_score: Number(relevance.score || 0),
    relevance_reason: relevance.reason || null,

    object_id: relevance.object_id || null,
    object_handle: relevance.object_handle || object?.handle || null,

    shot_id: relevance.shot_id || null,
    intent_id: relevance.intent_id || null,
    intent_phrase: relevance.intent_phrase || intent?.phrase || null,

    field_id: relevance.field_id || null,
    proximity_id: relevance.proximity_id || null,

    title: cleanText(body.title) || buildPingTitle({ object, shot, intent, relevance }),
    message: cleanText(body.message || body.note) || buildPingMessage({ object, shot, intent, relevance }),

    surface: cleanText(body.surface) || null,
    carrier: cleanText(body.carrier) || null,

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

  await appendIndex(env, "ping:index:from:" + ping.from_identity_id, ping.id);
  await appendIndex(env, "ping:index:to:" + ping.to_identity_id, ping.id);
  await appendIndex(env, "ping:index:kind:" + ping.kind, ping.id);
  await appendIndex(env, "ping:index:status:" + ping.status, ping.id);
  await appendIndex(env, "ping:index:relevance:" + relevance.id, ping.id);

  if (ping.object_id) {
    await appendIndex(env, "ping:index:object:" + ping.object_id, ping.id);
  }

  if (ping.intent_id) {
    await appendIndex(env, "ping:index:intent:" + ping.intent_id, ping.id);
  }

  if (ping.proximity_id) {
    await appendIndex(env, "ping:index:proximity:" + ping.proximity_id, ping.id);
  }

  await appendSync(env, ping.id, {
    type: "ping_created_from_relevance",
    ping_id: ping.id,
    relevance_id: relevance.id,
    from_identity_id: ping.from_identity_id,
    to_identity_id: ping.to_identity_id,
    object_id: ping.object_id,
    shot_id: ping.shot_id,
    intent_id: ping.intent_id,
    field_id: ping.field_id,
    proximity_id: ping.proximity_id,
    status: ping.status,
    at: now
  });

  await appendSync(env, ping.to_identity_id, {
    type: "identity_ping_received_from_relevance",
    ping_id: ping.id,
    relevance_id: relevance.id,
    from_identity_id: ping.from_identity_id,
    object_id: ping.object_id,
    shot_id: ping.shot_id,
    intent_id: ping.intent_id,
    field_id: ping.field_id,
    status: ping.status,
    at: now
  });

  await appendSync(env, ping.from_identity_id, {
    type: "identity_ping_sent_from_relevance",
    ping_id: ping.id,
    relevance_id: relevance.id,
    to_identity_id: ping.to_identity_id,
    object_id: ping.object_id,
    shot_id: ping.shot_id,
    intent_id: ping.intent_id,
    field_id: ping.field_id,
    status: ping.status,
    at: now
  });

  await appendSync(env, relevance.id, {
    type: "relevance_created_ping",
    relevance_id: relevance.id,
    ping_id: ping.id,
    from_identity_id: ping.from_identity_id,
    to_identity_id: ping.to_identity_id,
    object_id: ping.object_id,
    shot_id: ping.shot_id,
    intent_id: ping.intent_id,
    status: ping.status,
    at: now
  });

  if (ping.object_id) {
    await appendSync(env, ping.object_id, {
      type: "object_ping_created_from_relevance",
      ping_id: ping.id,
      relevance_id: relevance.id,
      from_identity_id: ping.from_identity_id,
      to_identity_id: ping.to_identity_id,
      intent_id: ping.intent_id,
      at: now
    });
  }

  if (ping.intent_id) {
    await appendSync(env, ping.intent_id, {
      type: "intent_ping_created_from_relevance",
      ping_id: ping.id,
      relevance_id: relevance.id,
      object_id: ping.object_id,
      to_identity_id: ping.to_identity_id,
      at: now
    });
  }

  if (ping.field_id) {
    await appendSync(env, ping.field_id, {
      type: "field_ping_created_from_relevance",
      ping_id: ping.id,
      relevance_id: relevance.id,
      object_id: ping.object_id,
      intent_id: ping.intent_id,
      to_identity_id: ping.to_identity_id,
      at: now
    });
  }

  return json({
    ok: true,
    created: true,
    ping_created: true,
    ping_id: ping.id,
    relevance_id: relevance.id,
    kind: ping.kind,
    status: ping.status,
    from_identity_id: ping.from_identity_id,
    to_identity_id: ping.to_identity_id,
    object_id: ping.object_id,
    object_handle: ping.object_handle,
    shot_id: ping.shot_id,
    intent_id: ping.intent_id,
    field_id: ping.field_id,
    proximity_id: ping.proximity_id,
    title: ping.title,
    message: ping.message,
    next: {
      route: "/api/carrier-route",
      method: "POST",
      reason: "ping_created_from_relevance"
    }
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

  const relevanceId = cleanText(
    url.searchParams.get("relevance_id") ||
    url.searchParams.get("relevanceId") ||
    url.searchParams.get("id")
  );

  if (!relevanceId) {
    return json({
      ok: false,
      error: "RELEVANCE_ID_REQUIRED"
    }, 400);
  }

  const relevance = await readRelevance(env, relevanceId);

  if (!relevance) {
    return json({
      ok: false,
      error: "RELEVANCE_NOT_FOUND"
    }, 404);
  }

  if (relevance.identity_id !== identityId) {
    return json({
      ok: false,
      error: "RELEVANCE_ACCESS_DENIED"
    }, 403);
  }

  const ids = await readIndex(env, "ping:index:relevance:" + relevance.id);
  const pings = [];

  for (const id of ids) {
    const ping = await readPing(env, id);

    if (!ping) continue;
    if (ping.to_identity_id !== identityId && ping.from_identity_id !== identityId) continue;

    pings.push(cleanPingForReturn(ping));
  }

  return json({
    ok: true,
    relevance_id: relevance.id,
    identity_id: identityId,
    count: pings.length,
    pings
  });
}

function buildPingTitle(input) {
  const object = input.object || {};
  const shot = input.shot || {};
  const intent = input.intent || {};
  const relevance = input.relevance || {};

  if (object.title && intent.phrase) {
    return "Relevant: " + object.title;
  }

  if (shot.title && intent.phrase) {
    return "Relevant shot: " + shot.title;
  }

  if (object.title) {
    return object.title;
  }

  if (shot.title) {
    return shot.title;
  }

  if (intent.phrase || relevance.intent_phrase) {
    return "Relevant movement";
  }

  return "CyberCrowd PING";
}

function buildPingMessage(input) {
  const object = input.object || {};
  const shot = input.shot || {};
  const intent = input.intent || {};
  const relevance = input.relevance || {};

  const phrase = intent.phrase || relevance.intent_phrase || "";
  const title = object.title || shot.title || "";

  if (title && phrase) {
    return title + " matched remembered intent: " + phrase;
  }

  if (title) {
    return title + " matched this field.";
  }

  if (phrase) {
    return "Remembered intent matched this field: " + phrase;
  }

  return "A relevant CyberCrowd movement is ready.";
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

async function readRelevance(env, relevanceId) {
  const id = cleanText(relevanceId);

  if (!id) return null;

  const raw = await env.IDENTITY.get("relevance:" + id);

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function readPing(env, pingId) {
  const id = cleanText(pingId);

  if (!id) return null;

  const raw = await env.IDENTITY.get("ping:" + id);

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function readObject(env, objectId) {
  const id = cleanText(objectId);

  if (!id) return null;

  const raw =
    await env.IDENTITY.get("object:" + id) ||
    await env.IDENTITY.get("obj:" + id);

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function readShot(env, shotId) {
  const id = cleanText(shotId);

  if (!id) return null;

  const raw = await env.IDENTITY.get("shot:" + id);

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function readIntent(env, intentId) {
  const id = cleanText(intentId);

  if (!id) return null;

  const raw = await env.IDENTITY.get("intent:" + id);

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function firstIndexValue(env, key) {
  const list = await readIndex(env, key);
  return list[0] || "";
}

async function readIndex(env, key) {
  const raw = await env.IDENTITY.get(key);

  if (!raw) return [];

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

async function appendIndex(env, key, value) {
  if (!key || !value) return;

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
  if (!targetId) return;

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

function cleanPingForReturn(ping) {
  return {
    id: ping.id,
    kind: ping.kind,
    status: ping.status,
    from_identity_id: ping.from_identity_id,
    to_identity_id: ping.to_identity_id,
    relevance_id: ping.relevance_id || null,
    object_id: ping.object_id || null,
    object_handle: ping.object_handle || null,
    shot_id: ping.shot_id || null,
    intent_id: ping.intent_id || null,
    field_id: ping.field_id || null,
    proximity_id: ping.proximity_id || null,
    title: ping.title || null,
    message: ping.message || null,
    surface: ping.surface || null,
    carrier: ping.carrier || null,
    created_at: ping.created_at || null,
    updated_at: ping.updated_at || null
  };
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
