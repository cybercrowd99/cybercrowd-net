/**
 * functions/api/surface-registry.js
 *
 * CyberCrowd Surface Registry
 *
 * ONE JOB:
 * Register the surfaces an identity can receive movement on.
 *
 * This is NOT chat.
 * This is NOT surveillance.
 * This is NOT notification spam.
 * This does NOT create a PING.
 *
 * Surface means:
 * phone, dashboard, XR, POS, camera, vehicle, wall, browser,
 * scanner, shop tile, headset, object link, email, internal,
 * or future CyberCrowd display.
 *
 * Flow:
 * surface exists
 *   ↓
 * surface-registry.js records it
 *   ↓
 * magic-cursor-presence.js says which surface is active now
 *   ↓
 * carrier-route.js chooses where movement should go
 *   ↓
 * ping-delivery.js records delivery
 */

const SURFACE_TTL_SECONDS = 60 * 60 * 24 * 365;
const INDEX_TTL_SECONDS = 60 * 60 * 24 * 365;
const MAX_INDEX_ITEMS = 100;

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
  "email",
  "internal",
  "unknown"
]);

const ALLOWED_STATUS = new Set([
  "active",
  "available",
  "paused",
  "disabled",
  "archived"
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
    body.type ||
    body.kind ||
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

  const status = cleanText(body.status || "available").toLowerCase();

  if (!ALLOWED_STATUS.has(status)) {
    return json({
      ok: false,
      error: "SURFACE_STATUS_NOT_ALLOWED",
      allowed: Array.from(ALLOWED_STATUS)
    }, 400);
  }

  const surfaceId = cleanText(
    body.surface_id ||
    body.surfaceId ||
    body.id
  ) || makeId("SURFACE");

  const now = new Date().toISOString();

  const record = {
    id: surfaceId,
    identity_id: identityId,

    surface,
    status,

    label: cleanText(body.label || body.name) || surface,
    device_id: cleanText(body.device_id || body.deviceId) || null,
    object_id: cleanText(body.object_id || body.objectId) || null,
    object_handle: cleanHandle(body.object_handle || body.objectHandle || body.handle) || null,

    priority: normalizePriority(body.priority),
    can_receive_ping: body.can_receive_ping !== false,
    can_show_object: body.can_show_object !== false,
    can_show_shot: body.can_show_shot !== false,
    can_receive_presence: body.can_receive_presence !== false,

    area: normalizeArea(body.area),

    created_at: now,
    updated_at: now,

    metadata: cleanMetadata(body.metadata)
  };

  await env.IDENTITY.put(
    "surface:" + record.id,
    JSON.stringify(record),
    {
      expirationTtl: SURFACE_TTL_SECONDS
    }
  );

  await appendIndex(env, "surface:index:identity:" + identityId, record.id);
  await appendIndex(env, "surface:index:type:" + surface, record.id);
  await appendIndex(env, "surface:index:status:" + status, record.id);

  await appendSync(env, identityId, {
    type: "surface_registered",
    surface_id: record.id,
    surface: record.surface,
    status: record.status,
    label: record.label,
    device_id: record.device_id,
    object_id: record.object_id,
    object_handle: record.object_handle,
    priority: record.priority,
    at: now
  });

  if (record.object_id) {
    await appendSync(env, record.object_id, {
      type: "object_surface_registered",
      surface_id: record.id,
      identity_id: identityId,
      surface: record.surface,
      status: record.status,
      at: now
    });
  }

  return json({
    ok: true,
    created: true,
    surface_id: record.id,
    identity_id: identityId,
    surface: record.surface,
    status: record.status,
    label: record.label,
    priority: record.priority,
    can_receive_ping: record.can_receive_ping,
    ping_created: false,
    next: {
      route: "/api/magic-cursor-presence",
      method: "POST",
      reason: "surface_ready_for_presence"
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

  const surfaceId = cleanText(
    url.searchParams.get("surface_id") ||
    url.searchParams.get("surfaceId") ||
    url.searchParams.get("id")
  );

  if (surfaceId) {
    const surface = await readSurface(env, surfaceId);

    if (!surface) {
      return json({
        ok: false,
        error: "SURFACE_NOT_FOUND"
      }, 404);
    }

    if (surface.identity_id !== identityId) {
      return json({
        ok: false,
        error: "SURFACE_ACCESS_DENIED"
      }, 403);
    }

    return json({
      ok: true,
      identity_id: identityId,
      surface: cleanSurfaceForReturn(surface)
    });
  }

  const includeArchived = url.searchParams.get("include_archived") === "true";
  const ids = await readIndex(env, "surface:index:identity:" + identityId);

  const surfaces = [];

  for (const id of ids) {
    const surface = await readSurface(env, id);

    if (!surface) continue;
    if (surface.identity_id !== identityId) continue;
    if (!includeArchived && surface.status === "archived") continue;

    surfaces.push(cleanSurfaceForReturn(surface));
  }

  surfaces.sort((a, b) => Number(b.priority || 0) - Number(a.priority || 0));

  return json({
    ok: true,
    identity_id: identityId,
    count: surfaces.length,
    surfaces
  });
}

export async function onRequestPatch(context) {
  return updateSurface(context);
}

async function updateSurface(context) {
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

  const surfaceId = cleanText(
    body.surface_id ||
    body.surfaceId ||
    body.id
  );

  if (!surfaceId) {
    return json({
      ok: false,
      error: "SURFACE_ID_REQUIRED"
    }, 400);
  }

  const existing = await readSurface(env, surfaceId);

  if (!existing) {
    return json({
      ok: false,
      error: "SURFACE_NOT_FOUND"
    }, 404);
  }

  if (existing.identity_id !== identityId) {
    return json({
      ok: false,
      error: "SURFACE_ACCESS_DENIED"
    }, 403);
  }

  const status = body.status
    ? cleanText(body.status).toLowerCase()
    : existing.status;

  if (!ALLOWED_STATUS.has(status)) {
    return json({
      ok: false,
      error: "SURFACE_STATUS_NOT_ALLOWED",
      allowed: Array.from(ALLOWED_STATUS)
    }, 400);
  }

  const now = new Date().toISOString();

  const updated = {
    ...existing,
    status,
    label: body.label || body.name ? cleanText(body.label || body.name) : existing.label,
    priority: body.priority == null ? existing.priority : normalizePriority(body.priority),
    can_receive_ping: body.can_receive_ping == null ? existing.can_receive_ping : body.can_receive_ping !== false,
    can_show_object: body.can_show_object == null ? existing.can_show_object : body.can_show_object !== false,
    can_show_shot: body.can_show_shot == null ? existing.can_show_shot : body.can_show_shot !== false,
    can_receive_presence: body.can_receive_presence == null ? existing.can_receive_presence : body.can_receive_presence !== false,
    updated_at: now,
    metadata: {
      ...(existing.metadata || {}),
      ...cleanMetadata(body.metadata)
    }
  };

  await env.IDENTITY.put(
    "surface:" + updated.id,
    JSON.stringify(updated),
    {
      expirationTtl: SURFACE_TTL_SECONDS
    }
  );

  await appendSync(env, identityId, {
    type: "surface_updated",
    surface_id: updated.id,
    surface: updated.surface,
    status: updated.status,
    label: updated.label,
    priority: updated.priority,
    at: now
  });

  return json({
    ok: true,
    updated: true,
    surface_id: updated.id,
    identity_id: identityId,
    surface: cleanSurfaceForReturn(updated),
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

async function readSurface(env, surfaceId) {
  const id = cleanText(surfaceId);

  if (!id) {
    return null;
  }

  const raw = await env.IDENTITY.get("surface:" + id);

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

function cleanSurfaceForReturn(surface) {
  return {
    id: surface.id,
    identity_id: surface.identity_id,
    surface: surface.surface,
    status: surface.status,
    label: surface.label,
    device_id: surface.device_id || null,
    object_id: surface.object_id || null,
    object_handle: surface.object_handle || null,
    priority: Number(surface.priority || 0),
    can_receive_ping: surface.can_receive_ping === true,
    can_show_object: surface.can_show_object === true,
    can_show_shot: surface.can_show_shot === true,
    can_receive_presence: surface.can_receive_presence === true,
    area: surface.area || null,
    created_at: surface.created_at || null,
    updated_at: surface.updated_at || null
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
  if (clean === "shop") return "shop_tile";
  if (clean === "tile") return "shop_tile";
  if (clean === "object") return "object_link";
  if (clean === "link") return "object_link";

  return clean;
}

function normalizePriority(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  if (number < 0) return 0;
  if (number > 100) return 100;

  return Math.floor(number);
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
