/**
 * functions/api/field-state.js
 *
 * CyberCrowd Field State
 *
 * ONE JOB:
 * Record the identity field where proximity can happen.
 *
 * This is NOT search.
 * This is NOT surveillance.
 * This is NOT Magic Cursor presence.
 * This is NOT a surface heartbeat.
 * This does NOT create a PING.
 *
 * Field means:
 * the active human/object area where relevance may happen.
 *
 * Surface says:
 * where movement can be shown.
 *
 * Presence says:
 * where the identity is active right now.
 *
 * Field says:
 * where proximity can matter.
 *
 * Flow:
 * identity field is active
 *   ↓
 * object enters field
 *   ↓
 * proximity-enter.js checks remembered intent
 *   ↓
 * ping.js creates one PING if relevant
 */

const FIELD_TTL_SECONDS = 60 * 60 * 24 * 7;
const INDEX_TTL_SECONDS = 60 * 60 * 24 * 90;
const MAX_INDEX_ITEMS = 100;

const ALLOWED_STATUS = new Set([
  "active",
  "idle",
  "paused",
  "closed"
]);

const ALLOWED_FIELD_KIND = new Set([
  "personal",
  "shopping",
  "service",
  "job",
  "event",
  "camera",
  "vehicle",
  "shop",
  "xr",
  "unknown"
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

  const fieldKind = normalizeFieldKind(
    body.kind ||
    body.field_kind ||
    body.fieldKind ||
    body.type ||
    "personal"
  );

  if (!ALLOWED_FIELD_KIND.has(fieldKind)) {
    return json({
      ok: false,
      error: "FIELD_KIND_NOT_ALLOWED",
      allowed: Array.from(ALLOWED_FIELD_KIND)
    }, 400);
  }

  const status = cleanText(body.status || "active").toLowerCase();

  if (!ALLOWED_STATUS.has(status)) {
    return json({
      ok: false,
      error: "FIELD_STATUS_NOT_ALLOWED",
      allowed: Array.from(ALLOWED_STATUS)
    }, 400);
  }

  const fieldId = cleanText(
    body.field_id ||
    body.fieldId ||
    body.id
  ) || makeId("FIELD");

  const now = new Date().toISOString();

  const field = {
    id: fieldId,
    identity_id: identityId,

    kind: fieldKind,
    status,
    active: status === "active",

    label: cleanText(body.label || body.name) || fieldKind,

    area: normalizeArea(body.area),
    radius_miles: normalizeRadius(body.radius_miles || body.radiusMiles),

    surface_id: cleanText(body.surface_id || body.surfaceId) || null,
    presence_id: cleanText(body.presence_id || body.presenceId) || null,

    object_id: cleanText(body.object_id || body.objectId) || null,
    object_handle: cleanHandle(body.object_handle || body.objectHandle || body.handle) || null,

    event_id: cleanText(body.event_id || body.eventId) || null,
    shot_id: cleanText(body.shot_id || body.shotId) || null,

    created_at: now,
    updated_at: now,

    metadata: cleanMetadata(body.metadata)
  };

  await env.IDENTITY.put(
    "field:" + identityId,
    JSON.stringify(field),
    {
      expirationTtl: FIELD_TTL_SECONDS
    }
  );

  await env.IDENTITY.put(
    "field:id:" + field.id,
    JSON.stringify(field),
    {
      expirationTtl: FIELD_TTL_SECONDS
    }
  );

  await appendIndex(env, "field:index:identity:" + identityId, field.id);
  await appendIndex(env, "field:index:kind:" + field.kind, field.id);
  await appendIndex(env, "field:index:status:" + field.status, field.id);

  await appendSync(env, identityId, {
    type: "identity_field_updated",
    field_id: field.id,
    kind: field.kind,
    status: field.status,
    active: field.active,
    label: field.label,
    radius_miles: field.radius_miles,
    surface_id: field.surface_id,
    presence_id: field.presence_id,
    object_id: field.object_id,
    event_id: field.event_id,
    shot_id: field.shot_id,
    at: now
  });

  await appendSync(env, field.id, {
    type: "field_state_recorded",
    field_id: field.id,
    identity_id: identityId,
    kind: field.kind,
    status: field.status,
    active: field.active,
    radius_miles: field.radius_miles,
    at: now
  });

  if (field.surface_id) {
    await appendSync(env, field.surface_id, {
      type: "surface_attached_to_field",
      field_id: field.id,
      identity_id: identityId,
      kind: field.kind,
      status: field.status,
      at: now
    });
  }

  if (field.object_id) {
    await appendSync(env, field.object_id, {
      type: "object_attached_to_field",
      field_id: field.id,
      identity_id: identityId,
      kind: field.kind,
      status: field.status,
      at: now
    });
  }

  return json({
    ok: true,
    created: true,
    field_id: field.id,
    identity_id: identityId,
    kind: field.kind,
    status: field.status,
    active: field.active,
    label: field.label,
    area: field.area,
    radius_miles: field.radius_miles,
    surface_id: field.surface_id,
    presence_id: field.presence_id,
    object_id: field.object_id,
    event_id: field.event_id,
    shot_id: field.shot_id,
    ping_created: false,
    next: {
      route: "/api/proximity-enter",
      method: "POST",
      reason: "field_ready_for_object_entry"
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

  const fieldId = cleanText(
    url.searchParams.get("field_id") ||
    url.searchParams.get("fieldId") ||
    url.searchParams.get("id")
  );

  let field = null;

  if (fieldId) {
    field = await readFieldById(env, fieldId);

    if (!field) {
      return json({
        ok: false,
        error: "FIELD_NOT_FOUND"
      }, 404);
    }

    if (field.identity_id !== identityId) {
      return json({
        ok: false,
        error: "FIELD_ACCESS_DENIED"
      }, 403);
    }
  } else {
    field = await readCurrentField(env, identityId);
  }

  if (!field) {
    return json({
      ok: true,
      identity_id: identityId,
      active: false,
      field: null,
      ping_created: false
    });
  }

  return json({
    ok: true,
    identity_id: identityId,
    active: field.status === "active",
    field: cleanFieldForReturn(field),
    ping_created: false
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

async function readCurrentField(env, identityId) {
  const raw = await env.IDENTITY.get("field:" + identityId);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function readFieldById(env, fieldId) {
  const id = cleanText(fieldId);

  if (!id) {
    return null;
  }

  const raw = await env.IDENTITY.get("field:id:" + id);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
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

function cleanFieldForReturn(field) {
  return {
    id: field.id,
    identity_id: field.identity_id,
    kind: field.kind,
    status: field.status,
    active: field.active === true,
    label: field.label || null,
    area: field.area || null,
    radius_miles: field.radius_miles || null,
    surface_id: field.surface_id || null,
    presence_id: field.presence_id || null,
    object_id: field.object_id || null,
    object_handle: field.object_handle || null,
    event_id: field.event_id || null,
    shot_id: field.shot_id || null,
    created_at: field.created_at || null,
    updated_at: field.updated_at || null
  };
}

function normalizeFieldKind(value) {
  const clean = cleanText(value).toLowerCase();

  if (!clean) return "unknown";

  if (clean === "person") return "personal";
  if (clean === "human") return "personal";
  if (clean === "store") return "shop";
  if (clean === "market") return "shopping";
  if (clean === "work") return "job";
  if (clean === "cam") return "camera";
  if (clean === "vr") return "xr";

  return clean;
}

function normalizeRadius(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 5;
  }

  if (number < 0.1) return 0.1;
  if (number > 100) return 100;

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

function cleanHandle(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .trim()
    .replace(/^cc:\/\//i, "")
    .replace(/^object:/i, "")
    .replace(/^obj:/i, "")
    .replace(/^\/+/, "")
    .toLowerCase();
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
