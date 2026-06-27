/**
 * functions/api/magic-cursor-presence.js
 *
 * CyberCrowd Magic Cursor Presence
 *
 * ONE JOB:
 * Record where a verified identity is active right now.
 *
 * This is NOT chat.
 * This is NOT surveillance.
 * This is NOT a notification system.
 * This does NOT create a PING.
 *
 * Magic Cursor means:
 * the active linkage cable between identity and surface.
 *
 * Surface means:
 * phone, dashboard, XR, POS, camera, vehicle, wall, shop tile,
 * headset, browser, scanner, or future CyberCrowd display.
 *
 * Flow:
 * identity becomes active on a surface
 *   ↓
 * magic-cursor-presence.js records the current surface
 *   ↓
 * ping.js / carrier can place relevant movement correctly
 */

const PRESENCE_TTL_SECONDS = 60 * 60 * 24 * 7;
const INDEX_TTL_SECONDS = 60 * 60 * 24 * 90;
const MAX_SYNC_ITEMS = 100;

const ALLOWED_SURFACES = new Set([
  "phone",
  "dashboard",
  "xr",
  "pos",
  "camera",
  "vehicle",
  "wall",
  "browser",
  "scanner",
  "shop_tile",
  "headset",
  "object_link",
  "unknown"
]);

const ALLOWED_STATUS = new Set([
  "active",
  "idle",
  "away",
  "closed"
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

  const surface = normalizeSurface(
    body.surface ||
    body.active_surface ||
    body.activeSurface ||
    body.device ||
    "unknown"
  );

  if (!ALLOWED_SURFACES.has(surface)) {
    return json({
      ok: false,
      error: "SURFACE_NOT_ALLOWED",
      allowed: Array.from(ALLOWED_SURFACES)
    }, 400);
  }

  const status = cleanText(body.status || "active").toLowerCase();

  if (!ALLOWED_STATUS.has(status)) {
    return json({
      ok: false,
      error: "PRESENCE_STATUS_NOT_ALLOWED",
      allowed: Array.from(ALLOWED_STATUS)
    }, 400);
  }

  const presenceId = cleanText(
    body.presence_id ||
    body.presenceId ||
    body.id
  ) || makeId("PRESENCE");

  const now = new Date().toISOString();

  const presence = {
    id: presenceId,
    identity_id: identityId,

    surface,
    status,

    looking_at: cleanText(body.looking_at || body.lookingAt) || null,
    object_id: cleanText(body.object_id || body.objectId) || null,
    object_handle: cleanHandle(body.object_handle || body.objectHandle || body.handle) || null,

    shot_id: cleanText(body.shot_id || body.shotId) || null,
    event_id: cleanText(body.event_id || body.eventId) || null,
    ping_id: cleanText(body.ping_id || body.pingId) || null,

    area: normalizeArea(body.area),

    created_at: now,
    updated_at: now,

    metadata: cleanMetadata(body.metadata)
  };

  await env.IDENTITY.put(
    "presence:" + identityId,
    JSON.stringify(presence),
    {
      expirationTtl: PRESENCE_TTL_SECONDS
    }
  );

  await env.IDENTITY.put(
    "presence:id:" + presence.id,
    JSON.stringify(presence),
    {
      expirationTtl: PRESENCE_TTL_SECONDS
    }
  );

  await appendIndex(env, "presence:index:identity:" + identityId, presence.id);
  await appendIndex(env, "presence:index:surface:" + surface, presence.id);

  await appendSync(env, identityId, {
    type: "magic_cursor_presence_updated",
    presence_id: presence.id,
    surface: presence.surface,
    status: presence.status,
    looking_at: presence.looking_at,
    object_id: presence.object_id,
    object_handle: presence.object_handle,
    shot_id: presence.shot_id,
    event_id: presence.event_id,
    ping_id: presence.ping_id,
    at: now
  });

  if (presence.object_id) {
    await appendSync(env, presence.object_id, {
      type: "object_entered_magic_cursor_surface",
      presence_id: presence.id,
      identity_id: identityId,
      surface: presence.surface,
      status: presence.status,
      at: now
    });
  }

  if (presence.shot_id) {
    await appendSync(env, presence.shot_id, {
      type: "shot_entered_magic_cursor_surface",
      presence_id: presence.id,
      identity_id: identityId,
      surface: presence.surface,
      status: presence.status,
      at: now
    });
  }

  if (presence.ping_id) {
    await appendSync(env, presence.ping_id, {
      type: "ping_entered_magic_cursor_surface",
      presence_id: presence.id,
      identity_id: identityId,
      surface: presence.surface,
      status: presence.status,
      at: now
    });
  }

  return json({
    ok: true,
    created: true,
    presence_id: presence.id,
    identity_id: identityId,
    surface: presence.surface,
    status: presence.status,
    looking_at: presence.looking_at,
    object_id: presence.object_id,
    object_handle: presence.object_handle,
    shot_id: presence.shot_id,
    event_id: presence.event_id,
    ping_id: presence.ping_id,
    ping_created: false
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

  const presence = await readPresence(env, identityId);

  if (!presence) {
    return json({
      ok: true,
      identity_id: identityId,
      active: false,
      presence: null
    });
  }

  return json({
    ok: true,
    identity_id: identityId,
    active: presence.status === "active",
    presence: cleanPresenceForReturn(presence)
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

async function readPresence(env, identityId) {
  const raw = await env.IDENTITY.get("presence:" + identityId);

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
  list = list.slice(0, MAX_SYNC_ITEMS);

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

  trail = trail.slice(0, MAX_SYNC_ITEMS);

  await env.IDENTITY.put(
    key,
    JSON.stringify(trail),
    {
      expirationTtl: INDEX_TTL_SECONDS
    }
  );
}

function cleanPresenceForReturn(presence) {
  return {
    id: presence.id,
    identity_id: presence.identity_id,
    surface: presence.surface,
    status: presence.status,
    looking_at: presence.looking_at || null,
    object_id: presence.object_id || null,
    object_handle: presence.object_handle || null,
    shot_id: presence.shot_id || null,
    event_id: presence.event_id || null,
    ping_id: presence.ping_id || null,
    area: presence.area || null,
    created_at: presence.created_at || null,
    updated_at: presence.updated_at || null
  };
}

function normalizeSurface(value) {
  const clean = cleanText(value).toLowerCase();

  if (!clean) return "unknown";

  if (clean === "mobile") return "phone";
  if (clean === "phone_camera") return "camera";
  if (clean === "cam") return "camera";
  if (clean === "browser_tab") return "browser";
  if (clean === "web") return "browser";
  if (clean === "vr") return "xr";
  if (clean === "headset") return "headset";
  if (clean === "shop") return "shop_tile";
  if (clean === "tile") return "shop_tile";
  if (clean === "object") return "object_link";
  if (clean === "link") return "object_link";

  return clean;
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
