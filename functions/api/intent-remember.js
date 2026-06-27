/**
 * functions/api/intent-remember.js
 *
 * CyberCrowd Intent Remember
 *
 * ONE JOB:
 * Let a verified identity remember intent so proximity-enter
 * has something to match against.
 *
 * This is NOT search.
 * This is NOT chat.
 * This is NOT a wishlist.
 * This is NOT notification spam.
 * This does NOT create a PING.
 *
 * Intent means:
 * the identity has a remembered need, interest, capability gap,
 * shopping moment, service need, job need, object need, or I CAN direction.
 *
 * Flow:
 * identity remembers intent
 *   ↓
 * object enters field
 *   ↓
 * proximity-enter.js decides if it matters
 *   ↓
 * ping.js creates one PING if relevant
 */

const INTENT_TTL_SECONDS = 60 * 60 * 24 * 30;
const INDEX_TTL_SECONDS = 60 * 60 * 24 * 90;
const MAX_INDEX_ITEMS = 100;

const ALLOWED_STATUS = new Set([
  "active",
  "paused",
  "fulfilled",
  "expired",
  "archived"
]);

const ALLOWED_KIND = new Set([
  "need",
  "want",
  "shopping",
  "service",
  "job",
  "object",
  "event",
  "evidence",
  "ican",
  "general"
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

  const phrase = cleanText(
    body.phrase ||
    body.intent ||
    body.need ||
    body.want ||
    body.title
  );

  const tags = normalizeTags(
    body.tags ||
    body.keywords ||
    phrase
  );

  if (!phrase && tags.length === 0) {
    return json({
      ok: false,
      error: "INTENT_PHRASE_OR_TAGS_REQUIRED"
    }, 400);
  }

  const kind = cleanText(body.kind || body.type || "general").toLowerCase();

  if (!ALLOWED_KIND.has(kind)) {
    return json({
      ok: false,
      error: "INTENT_KIND_NOT_ALLOWED",
      allowed: Array.from(ALLOWED_KIND)
    }, 400);
  }

  const status = cleanText(body.status || "active").toLowerCase();

  if (!ALLOWED_STATUS.has(status)) {
    return json({
      ok: false,
      error: "INTENT_STATUS_NOT_ALLOWED",
      allowed: Array.from(ALLOWED_STATUS)
    }, 400);
  }

  const intentId = cleanText(
    body.intent_id ||
    body.intentId ||
    body.id
  ) || makeId("INTENT");

  const now = new Date().toISOString();

  const intent = {
    id: intentId,
    identity_id: identityId,

    kind,
    status,
    active: status === "active",

    phrase,
    tags,

    area: normalizeArea(body.area),
    radius_miles: normalizeRadius(body.radius_miles || body.radiusMiles),

    object_type: cleanText(body.object_type || body.objectType) || null,
    object_id: cleanText(body.object_id || body.objectId) || null,
    service_id: cleanText(body.service_id || body.serviceId) || null,
    event_id: cleanText(body.event_id || body.eventId) || null,
    ican_id: cleanText(body.ican_id || body.icanId) || null,

    created_at: now,
    updated_at: now,
    expires_at: cleanText(body.expires_at || body.expiresAt) || null,

    metadata: cleanMetadata(body.metadata)
  };

  await env.IDENTITY.put(
    "intent:" + intent.id,
    JSON.stringify(intent),
    {
      expirationTtl: INTENT_TTL_SECONDS
    }
  );

  await appendIndex(env, "intent:index:" + identityId, intent.id);
  await appendIndex(env, "intent:index:kind:" + intent.kind, intent.id);
  await appendIndex(env, "intent:index:status:" + intent.status, intent.id);

  await appendSync(env, intent.id, {
    type: "intent_remembered",
    intent_id: intent.id,
    identity_id: identityId,
    kind: intent.kind,
    phrase: intent.phrase,
    at: now
  });

  await appendSync(env, identityId, {
    type: "identity_intent_remembered",
    intent_id: intent.id,
    kind: intent.kind,
    phrase: intent.phrase,
    tags: intent.tags,
    radius_miles: intent.radius_miles,
    at: now
  });

  return json({
    ok: true,
    created: true,
    intent_id: intent.id,
    identity_id: intent.identity_id,
    kind: intent.kind,
    status: intent.status,
    active: intent.active,
    phrase: intent.phrase,
    tags: intent.tags,
    radius_miles: intent.radius_miles,
    ping_created: false,
    next: {
      route: "/api/proximity-enter",
      method: "POST",
      reason: "intent_ready_for_object_field_match"
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
  const includeArchived = url.searchParams.get("include_archived") === "true";

  const ids = await readIndex(env, "intent:index:" + identityId);
  const intents = [];

  for (const id of ids) {
    const intent = await readIntent(env, id);

    if (!intent) continue;
    if (intent.identity_id !== identityId) continue;

    if (!includeArchived && intent.status === "archived") {
      continue;
    }

    intents.push(cleanIntentForReturn(intent));
  }

  return json({
    ok: true,
    identity_id: identityId,
    count: intents.length,
    intents
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

async function readIntent(env, intentId) {
  const id = cleanText(intentId);

  if (!id) {
    return null;
  }

  const raw = await env.IDENTITY.get("intent:" + id);

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

function cleanIntentForReturn(intent) {
  return {
    id: intent.id,
    identity_id: intent.identity_id,
    kind: intent.kind,
    status: intent.status,
    active: intent.active === true,
    phrase: intent.phrase || "",
    tags: Array.isArray(intent.tags) ? intent.tags : [],
    area: intent.area || null,
    radius_miles: intent.radius_miles || null,
    object_type: intent.object_type || null,
    object_id: intent.object_id || null,
    service_id: intent.service_id || null,
    event_id: intent.event_id || null,
    ican_id: intent.ican_id || null,
    created_at: intent.created_at || null,
    updated_at: intent.updated_at || null,
    expires_at: intent.expires_at || null
  };
}

function normalizeRadius(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 5;
  }

  if (number < 0.1) {
    return 0.1;
  }

  if (number > 100) {
    return 100;
  }

  return Math.round(number * 100) / 100;
}

function normalizeArea(area) {
  if (!area || typeof area !== "object") return null;

  const lat = Number(area.lat || area.latitude);
  const lng = Number(area.lng || area.longitude);

  return {
    label: cleanText(area.label || area.name),
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null
  };
}

function normalizeTags(value) {
  if (!value) return [];

  const list = Array.isArray(value)
    ? value
    : String(value).split(/[\s,]+/);

  return Array.from(
    new Set(
      list
        .map((item) => String(item).trim().toLowerCase())
        .filter(Boolean)
    )
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
