/**
 * functions/api/surface-heartbeat.js
 *
 * CyberCrowd Surface Heartbeat
 *
 * ONE JOB:
 * Keep a registered surface alive without turning it into presence.
 *
 * This is NOT Magic Cursor presence.
 * This is NOT Synthetic Presence.
 * This is NOT chat.
 * This is NOT surveillance.
 * This is NOT notification spam.
 * This does NOT create a PING.
 * This does NOT claim the human is active.
 *
 * Surface Registry says:
 * the surface exists.
 *
 * Surface Heartbeat says:
 * the surface is still reachable.
 *
 * Magic Cursor Presence says:
 * the identity is active there right now.
 *
 * Flow:
 * surface exists
 *   ↓
 * surface-heartbeat.js keeps the surface alive
 *   ↓
 * magic-cursor-presence.js can attach active identity context
 *   ↓
 * carrier-route.js can choose a live surface
 *   ↓
 * ping-delivery.js records delivery
 */

const SURFACE_TTL_SECONDS = 60 * 60 * 24 * 365;
const HEARTBEAT_TTL_SECONDS = 60 * 10;
const INDEX_TTL_SECONDS = 60 * 60 * 24 * 90;
const MAX_INDEX_ITEMS = 100;

const ALLOWED_STATUS = new Set([
  "alive",
  "idle",
  "sleeping",
  "offline",
  "blocked"
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

  const surfaceId = cleanText(
    body.surface_id ||
      body.surfaceId ||
      body.id
  );

  if (!surfaceId) {
    return json({ ok: false, error: "SURFACE_ID_REQUIRED" }, 400);
  }

  const surface = await readSurface(env, surfaceId);

  if (!surface) {
    return json({ ok: false, error: "SURFACE_NOT_FOUND" }, 404);
  }

  const normalizedSurface = normalizeSurfaceRecord(surface, surfaceId);

  if (normalizedSurface.identity_id !== identityId) {
    return json({ ok: false, error: "SURFACE_ACCESS_DENIED" }, 403);
  }

  const status = cleanText(body.status || "alive").toLowerCase();

  if (!ALLOWED_STATUS.has(status)) {
    return json(
      {
        ok: false,
        error: "SURFACE_HEARTBEAT_STATUS_NOT_ALLOWED",
        allowed: Array.from(ALLOWED_STATUS)
      },
      400
    );
  }

  const now = new Date().toISOString();
  const heartbeatId = cleanText(body.heartbeat_id || body.heartbeatId) || makeId("SURFACE_HEARTBEAT");

  const heartbeat = {
    id: heartbeatId,
    heartbeat_id: heartbeatId,

    surface_id: normalizedSurface.id,
    identity_id: identityId,
    actor_identity_id: identityId,

    surface: normalizedSurface.surface,
    status,

    live: status === "alive" || status === "idle",
    reachable: status === "alive" || status === "idle" || status === "sleeping",

    device_id: normalizedSurface.device_id || null,
    label: normalizedSurface.label || null,

    object_id: normalizedSurface.object_id || null,
    object_handle: normalizedSurface.object_handle || null,

    battery: normalizeNumber(body.battery),
    signal: normalizeNumber(body.signal),
    load: normalizeNumber(body.load),

    area: normalizeArea(body.area) || normalizedSurface.area || null,

    checked_at: now,
    created_at: now,
    updated_at: now,

    ping_created: false,
    presence_created: false,
    human_claimed: false,
    fake_activity: false,
    human_imitation: false,

    metadata: cleanMetadata(body.metadata)
  };

  const nextSurface = {
    ...surface,

    id: normalizedSurface.id,
    surface_id: normalizedSurface.id,
    identity_id: identityId,

    surface: normalizedSurface.surface,

    heartbeat_status: heartbeat.status,
    heartbeat_live: heartbeat.live,
    heartbeat_reachable: heartbeat.reachable,
    last_heartbeat_at: now,
    updated_at: now
  };

  if (status === "offline") {
    nextSurface.status = "paused";
  }

  if (status === "blocked") {
    nextSurface.status = "disabled";
  }

  await env.IDENTITY.put("surface:" + normalizedSurface.id, JSON.stringify(nextSurface), {
    expirationTtl: SURFACE_TTL_SECONDS
  });

  await env.IDENTITY.put("surface-heartbeat:" + heartbeat.id, JSON.stringify(heartbeat), {
    expirationTtl: HEARTBEAT_TTL_SECONDS
  });

  await env.IDENTITY.put("surface-live:" + normalizedSurface.id, JSON.stringify(heartbeat), {
    expirationTtl: HEARTBEAT_TTL_SECONDS
  });

  await env.IDENTITY.put("surface-live:identity:" + identityId, JSON.stringify(heartbeat), {
    expirationTtl: HEARTBEAT_TTL_SECONDS
  });

  await appendIndex(env, "surface-heartbeat:index:surface:" + normalizedSurface.id, heartbeat.id);
  await appendIndex(env, "surface-heartbeat:index:identity:" + identityId, heartbeat.id);
  await appendIndex(env, "surface-heartbeat:index:status:" + status, heartbeat.id);

  await appendSync(env, identityId, {
    type: "surface_heartbeat",
    surface_id: normalizedSurface.id,
    heartbeat_id: heartbeat.id,
    surface: heartbeat.surface,
    status: heartbeat.status,
    live: heartbeat.live,
    reachable: heartbeat.reachable,
    label: heartbeat.label,
    device_id: heartbeat.device_id,
    at: now
  });

  await appendSync(env, normalizedSurface.id, {
    type: "surface_alive",
    surface_id: normalizedSurface.id,
    heartbeat_id: heartbeat.id,
    identity_id: identityId,
    status: heartbeat.status,
    live: heartbeat.live,
    reachable: heartbeat.reachable,
    at: now
  });

  if (normalizedSurface.object_id) {
    await appendSync(env, normalizedSurface.object_id, {
      type: "object_surface_heartbeat",
      surface_id: normalizedSurface.id,
      heartbeat_id: heartbeat.id,
      identity_id: identityId,
      status: heartbeat.status,
      live: heartbeat.live,
      reachable: heartbeat.reachable,
      at: now
    });
  }

  return json({
    ok: true,
    created: true,
    heartbeat_id: heartbeat.id,
    surface_id: normalizedSurface.id,
    identity_id: identityId,
    surface: heartbeat.surface,
    status: heartbeat.status,
    live: heartbeat.live,
    reachable: heartbeat.reachable,
    ping_created: false,
    presence_created: false,
    human_claimed: false,
    fake_activity: false,
    human_imitation: false,
    next: {
      route: "/api/magic-cursor-presence",
      method: "POST",
      reason: "surface_alive_if_identity_is_active_here"
    }
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

  const surfaceId = cleanText(
    url.searchParams.get("surface_id") ||
      url.searchParams.get("surfaceId") ||
      url.searchParams.get("id")
  );

  if (!surfaceId) {
    return json({ ok: false, error: "SURFACE_ID_REQUIRED" }, 400);
  }

  const surface = await readSurface(env, surfaceId);

  if (!surface) {
    return json({ ok: false, error: "SURFACE_NOT_FOUND" }, 404);
  }

  const normalizedSurface = normalizeSurfaceRecord(surface, surfaceId);

  if (normalizedSurface.identity_id !== identityId) {
    return json({ ok: false, error: "SURFACE_ACCESS_DENIED" }, 403);
  }

  const live = await readLiveHeartbeat(env, normalizedSurface.id);

  return json({
    ok: true,
    surface_id: normalizedSurface.id,
    identity_id: identityId,
    surface: normalizedSurface.surface,
    registered_status: cleanText(surface.status || ""),
    live: !!live && (live.status === "alive" || live.status === "idle"),
    reachable: !!live && (
      live.status === "alive" ||
      live.status === "idle" ||
      live.status === "sleeping"
    ),
    heartbeat: live ? cleanHeartbeatForReturn(live) : null,
    ping_created: false,
    presence_created: false,
    human_claimed: false,
    fake_activity: false,
    human_imitation: false
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

async function readSurface(env, surfaceId) {
  const id = cleanText(surfaceId);

  if (!id) return null;

  return readJsonKey(env, "surface:" + id);
}

async function readLiveHeartbeat(env, surfaceId) {
  const id = cleanText(surfaceId);

  if (!id) return null;

  return readJsonKey(env, "surface-live:" + id);
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

function normalizeSurfaceRecord(surface, fallbackId) {
  return {
    ...surface,

    id: cleanText(surface.id || surface.surface_id || surface.surfaceId || fallbackId),
    surface_id: cleanText(surface.surface_id || surface.surfaceId || surface.id || fallbackId),

    identity_id: cleanText(
      surface.identity_id ||
        surface.identityId ||
        surface.owner_identity_id ||
        surface.ownerIdentityId ||
        ""
    ),

    surface: cleanText(surface.surface || surface.kind || surface.type || "unknown").toLowerCase(),

    device_id: cleanText(surface.device_id || surface.deviceId || ""),
    label: cleanText(surface.label || surface.name || ""),

    object_id: cleanText(surface.object_id || surface.objectId || ""),
    object_handle: cleanText(surface.object_handle || surface.objectHandle || ""),

    area: normalizeArea(surface.area)
  };
}

function cleanHeartbeatForReturn(heartbeat) {
  return {
    id: heartbeat.id,
    heartbeat_id: heartbeat.heartbeat_id || heartbeat.id,
    surface_id: heartbeat.surface_id,
    identity_id: heartbeat.identity_id,
    surface: heartbeat.surface,
    status: heartbeat.status,
    live: heartbeat.live,
    reachable: heartbeat.reachable,
    label: heartbeat.label || null,
    device_id: heartbeat.device_id || null,
    object_id: heartbeat.object_id || null,
    object_handle: heartbeat.object_handle || null,
    battery: heartbeat.battery,
    signal: heartbeat.signal,
    load: heartbeat.load,
    area: heartbeat.area || null,
    checked_at: heartbeat.checked_at || null,
    created_at: heartbeat.created_at || null,
    updated_at: heartbeat.updated_at || null,
    ping_created: false,
    presence_created: false,
    human_claimed: false,
    fake_activity: false,
    human_imitation: false
  };
}

function normalizeNumber(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return null;
  }

  if (number < 0) return 0;
  if (number > 100) return 100;

  return Math.round(number * 100) / 100;
}

function normalizeArea(area) {
  if (!area || typeof area !== "object" || Array.isArray(area)) {
    return null;
  }

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
