/**
 * functions/api/field-close.js
 *
 * CyberCrowd Field Close
 *
 * ONE JOB:
 * Close an active identity field so proximity stops mattering there.
 *
 * This is NOT proximity-exit.
 * This is NOT Magic Cursor presence.
 * This is NOT surface heartbeat.
 * This is NOT logout.
 * This does NOT create a PING.
 * This does NOT fake human presence.
 *
 * Field State says:
 * where proximity can matter.
 *
 * Field Close says:
 * this field no longer accepts proximity movement.
 *
 * Flow:
 * field-state.js opens or holds the active field
 *   ↓
 * object may enter field
 *   ↓
 * proximity-enter.js may create PING
 *   ↓
 * synthetic-presence.js may mark collapse readiness
 *   ↓
 * field-close.js closes the field
 */

const FIELD_TTL_SECONDS = 60 * 60 * 24 * 7;
const INDEX_TTL_SECONDS = 60 * 60 * 24 * 90;
const MAX_INDEX_ITEMS = 100;

const ALLOWED_CLOSE_REASONS = new Set([
  "manual",
  "left_area",
  "surface_closed",
  "session_closed",
  "event_finished",
  "object_removed",
  "timeout",
  "synthetic_presence_collapsed",
  "other"
]);

const CLOSED_STATUSES = new Set([
  "closed",
  "collapsed",
  "ended",
  "inactive"
]);

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env || !env.IDENTITY) {
    return json({ ok: false, error: "IDENTITY_KV_MISSING" }, 500);
  }

  const session = await readVerifiedSession(request, env);

  if (!session) {
    return json({ ok: false, error: "SESSION_REQUIRED" }, 401);
  }

  const identityId = getIdentityIdFromSession(session);

  if (!identityId) {
    return json({ ok: false, error: "SESSION_IDENTITY_MISSING" }, 401);
  }

  const body = await readRequestJson(request);

  if (!body) {
    return json({ ok: false, error: "JSON_REQUIRED" }, 400);
  }

  const fieldId = cleanText(body.field_id || body.fieldId || body.id);

  let field = null;

  if (fieldId) {
    field = await readFieldById(env, fieldId);
  } else {
    field = await readCurrentField(env, identityId);
  }

  if (!field) {
    return json({ ok: false, error: "FIELD_NOT_FOUND" }, 404);
  }

  const normalizedField = normalizeField(field, fieldId);

  if (normalizedField.identity_id !== identityId) {
    return json({ ok: false, error: "FIELD_ACCESS_DENIED" }, 403);
  }

  if (CLOSED_STATUSES.has(normalizedField.status) || normalizedField.active === false) {
    return json({
      ok: true,
      already_closed: true,
      closed: true,
      field_id: normalizedField.id,
      identity_id: identityId,
      status: "closed",
      active: false,
      ping_created: false,
      proximity_created: false
    });
  }

  const closeReason = normalizeCloseReason(
    body.reason ||
      body.close_reason ||
      body.closeReason ||
      ""
  );

  if (!closeReason) {
    return json(
      {
        ok: false,
        error: "FIELD_CLOSE_REASON_NOT_ALLOWED",
        allowed: Array.from(ALLOWED_CLOSE_REASONS)
      },
      400
    );
  }

  const presence = await readPresence(env, identityId);

  if (
    closeReason === "synthetic_presence_collapsed" &&
    presence &&
    cleanText(presence.state).toLowerCase() !== "collapsed" &&
    cleanText(presence.status).toLowerCase() !== "collapsed"
  ) {
    return json(
      {
        ok: false,
        error: "SYNTHETIC_PRESENCE_NOT_COLLAPSED",
        reason: "field_close_requested_by_synthetic_presence_before_collapse"
      },
      409
    );
  }

  const now = new Date().toISOString();
  const closeId = cleanText(body.close_id || body.closeId) || makeId("FIELD_CLOSE");

  const closedField = {
    ...field,

    id: normalizedField.id,
    field_id: normalizedField.id,

    identity_id: identityId,

    status: "closed",
    active: false,
    accepts_proximity: false,
    proximity_open: false,
    lane_lock: false,

    closed_at: now,
    close_id: closeId,
    close_reason: closeReason,
    updated_at: now
  };

  const closeRecord = {
    id: closeId,
    close_id: closeId,

    field_id: normalizedField.id,
    identity_id: identityId,
    actor_identity_id: identityId,

    kind: normalizedField.kind || null,
    label: normalizedField.label || null,

    reason: closeReason,
    note: cleanText(body.note || body.description) || null,

    surface_id: normalizedField.surface_id || null,
    presence_id:
      normalizedField.presence_id ||
      cleanText(presence?.id || presence?.presence_id) ||
      null,

    object_id: normalizedField.object_id || null,
    object_handle: normalizedField.object_handle || null,
    event_id: normalizedField.event_id || null,
    shot_id: normalizedField.shot_id || null,

    synthetic_presence_state: cleanText(presence?.state || "") || null,
    synthetic_presence_status: cleanText(presence?.status || "") || null,

    ping_created: false,
    proximity_created: false,
    fake_activity: false,
    human_imitation: false,

    created_at: now,
    updated_at: now,

    metadata: cleanMetadata(body.metadata)
  };

  await env.IDENTITY.put("field:id:" + closedField.id, JSON.stringify(closedField), {
    expirationTtl: FIELD_TTL_SECONDS
  });

  await env.IDENTITY.put("field-close:" + closeRecord.id, JSON.stringify(closeRecord), {
    expirationTtl: FIELD_TTL_SECONDS
  });

  const current = await readCurrentField(env, identityId);

  if (current && cleanText(current.id || current.field_id) === closedField.id) {
    await env.IDENTITY.put("field:" + identityId, JSON.stringify(closedField), {
      expirationTtl: FIELD_TTL_SECONDS
    });
  }

  await appendIndex(env, "field-close:index:identity:" + identityId, closeRecord.id);
  await appendIndex(env, "field-close:index:field:" + closedField.id, closeRecord.id);
  await appendIndex(env, "field:index:status:closed", closedField.id);
  await appendIndex(env, "field:index:identity:" + identityId, closedField.id);

  await appendSync(env, identityId, {
    type: "identity_field_closed",
    field_id: closedField.id,
    field_close_id: closeRecord.id,
    reason: closeReason,
    kind: closeRecord.kind,
    label: closeRecord.label,
    surface_id: closeRecord.surface_id,
    presence_id: closeRecord.presence_id,
    object_id: closeRecord.object_id,
    event_id: closeRecord.event_id,
    shot_id: closeRecord.shot_id,
    accepts_proximity: false,
    lane_lock: false,
    at: now
  });

  await appendSync(env, closedField.id, {
    type: "field_closed",
    field_id: closedField.id,
    field_close_id: closeRecord.id,
    identity_id: identityId,
    reason: closeReason,
    accepts_proximity: false,
    at: now
  });

  if (closeRecord.surface_id) {
    await appendSync(env, closeRecord.surface_id, {
      type: "surface_field_closed",
      field_id: closedField.id,
      field_close_id: closeRecord.id,
      identity_id: identityId,
      reason: closeReason,
      at: now
    });
  }

  if (closeRecord.presence_id) {
    await appendSync(env, closeRecord.presence_id, {
      type: "presence_field_closed",
      field_id: closedField.id,
      field_close_id: closeRecord.id,
      identity_id: identityId,
      reason: closeReason,
      at: now
    });
  }

  if (closeRecord.object_id) {
    await appendSync(env, closeRecord.object_id, {
      type: "object_field_closed",
      field_id: closedField.id,
      field_close_id: closeRecord.id,
      identity_id: identityId,
      reason: closeReason,
      at: now
    });
  }

  if (closeRecord.event_id) {
    await appendSync(env, closeRecord.event_id, {
      type: "event_field_closed",
      field_id: closedField.id,
      field_close_id: closeRecord.id,
      identity_id: identityId,
      reason: closeReason,
      at: now
    });
  }

  if (closeRecord.shot_id) {
    await appendSync(env, closeRecord.shot_id, {
      type: "shot_field_closed",
      field_id: closedField.id,
      field_close_id: closeRecord.id,
      identity_id: identityId,
      reason: closeReason,
      at: now
    });
  }

  return json({
    ok: true,
    closed: true,
    field_close_id: closeRecord.id,
    field_id: closedField.id,
    identity_id: identityId,
    status: "closed",
    active: false,
    accepts_proximity: false,
    lane_lock: false,
    reason: closeReason,
    ping_created: false,
    proximity_created: false,
    fake_activity: false,
    human_imitation: false
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;

  if (!env || !env.IDENTITY) {
    return json({ ok: false, error: "IDENTITY_KV_MISSING" }, 500);
  }

  const session = await readVerifiedSession(request, env);

  if (!session) {
    return json({ ok: false, error: "SESSION_REQUIRED" }, 401);
  }

  const identityId = getIdentityIdFromSession(session);

  if (!identityId) {
    return json({ ok: false, error: "SESSION_IDENTITY_MISSING" }, 401);
  }

  const url = new URL(request.url);
  const fieldId = cleanText(
    url.searchParams.get("field_id") ||
      url.searchParams.get("fieldId") ||
      url.searchParams.get("id")
  );

  let ids = [];

  if (fieldId) {
    const field = await readFieldById(env, fieldId);

    if (!field) {
      return json({ ok: false, error: "FIELD_NOT_FOUND" }, 404);
    }

    const normalizedField = normalizeField(field, fieldId);

    if (normalizedField.identity_id !== identityId) {
      return json({ ok: false, error: "FIELD_ACCESS_DENIED" }, 403);
    }

    ids = await readIndex(env, "field-close:index:field:" + normalizedField.id);
  } else {
    ids = await readIndex(env, "field-close:index:identity:" + identityId);
  }

  const closes = [];

  for (const id of ids) {
    const close = await readClose(env, id);

    if (!close) continue;
    if (cleanText(close.identity_id) !== identityId) continue;

    closes.push(cleanCloseForReturn(close));
  }

  return json({
    ok: true,
    identity_id: identityId,
    count: closes.length,
    field_closes: closes,
    ping_created: false,
    proximity_created: false
  });
}

async function readVerifiedSession(request, env) {
  const token =
    getCookie(request, "session") ||
    getCookie(request, "cc_session") ||
    getCookie(request, "EAT") ||
    getBearerToken(request);

  if (!token) return null;

  return readJsonKey(env, "session:" + token);
}

function getIdentityIdFromSession(session) {
  return cleanText(
    session.identity_id ||
      session.identityId ||
      session.identity_active_id ||
      session["identity-active-id"] ||
      session.idl ||
      session.email ||
      ""
  );
}

async function readRequestJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

async function readJsonKey(env, key) {
  const raw = await env.IDENTITY.get(key);

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function readCurrentField(env, identityId) {
  const id = cleanText(identityId);

  if (!id) return null;

  return readJsonKey(env, "field:" + id);
}

async function readFieldById(env, fieldId) {
  const id = cleanText(fieldId);

  if (!id) return null;

  return readJsonKey(env, "field:id:" + id);
}

async function readPresence(env, identityId) {
  const id = cleanText(identityId);

  if (!id) return null;

  return readJsonKey(env, "presence:" + id);
}

async function readClose(env, closeId) {
  const id = cleanText(closeId);

  if (!id) return null;

  return readJsonKey(env, "field-close:" + id);
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

  await env.IDENTITY.put(key, JSON.stringify(list), {
    expirationTtl: INDEX_TTL_SECONDS
  });
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

  await env.IDENTITY.put(key, JSON.stringify(trail), {
    expirationTtl: INDEX_TTL_SECONDS
  });
}

function normalizeField(field, fallbackId) {
  return {
    ...field,

    id: cleanText(field.id || field.field_id || field.fieldId || fallbackId),
    field_id: cleanText(field.field_id || field.fieldId || field.id || fallbackId),

    identity_id: cleanText(
      field.identity_id ||
        field.identityId ||
        field.owner_identity_id ||
        field.ownerIdentityId ||
        ""
    ),

    kind: cleanText(field.kind || ""),
    label: cleanText(field.label || ""),

    status: cleanText(field.status || "").toLowerCase(),
    active: field.active !== false,

    surface_id: cleanText(field.surface_id || field.surfaceId || ""),
    presence_id: cleanText(field.presence_id || field.presenceId || ""),
    object_id: cleanText(field.object_id || field.objectId || ""),
    object_handle: cleanText(field.object_handle || field.objectHandle || ""),
    event_id: cleanText(field.event_id || field.eventId || ""),
    shot_id: cleanText(field.shot_id || field.shotId || "")
  };
}

function cleanCloseForReturn(close) {
  return {
    id: close.id,
    close_id: close.close_id || close.id,
    field_id: close.field_id,
    identity_id: close.identity_id,
    actor_identity_id: close.actor_identity_id || close.identity_id,
    kind: close.kind || null,
    label: close.label || null,
    reason: close.reason || null,
    note: close.note || null,
    surface_id: close.surface_id || null,
    presence_id: close.presence_id || null,
    object_id: close.object_id || null,
    object_handle: close.object_handle || null,
    event_id: close.event_id || null,
    shot_id: close.shot_id || null,
    synthetic_presence_state: close.synthetic_presence_state || null,
    synthetic_presence_status: close.synthetic_presence_status || null,
    ping_created: false,
    proximity_created: false,
    fake_activity: false,
    human_imitation: false,
    created_at: close.created_at || null,
    updated_at: close.updated_at || null
  };
}

function normalizeCloseReason(value) {
  const clean = cleanText(value || "manual").toLowerCase();

  if (ALLOWED_CLOSE_REASONS.has(clean)) {
    return clean;
  }

  return "";
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

  if (!match) return "";

  return match[1].trim();
}

function cleanText(value) {
  if (typeof value !== "string" && typeof value !== "number") {
    return "";
  }

  return String(value).trim();
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
