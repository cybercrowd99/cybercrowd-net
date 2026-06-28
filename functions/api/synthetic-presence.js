/**
 * functions/api/synthetic-presence.js
 *
 * CyberCrowd Synthetic Presence
 *
 * ONE JOB:
 * Stabilize active identity moments when human input pauses,
 * without pretending to be human.
 *
 * This is NOT fake activity.
 * This is NOT chat.
 * This is NOT emotion.
 * This is NOT automation pretending to be the user.
 * This does NOT create PINGs.
 * This does NOT make decisions for the user.
 *
 * Synthetic Presence means:
 * CyberCrowd can hold a lane lock, buffer jitter, keep surfaces in sync,
 * and collapse the moment cleanly when real absence is detected.
 *
 * Core states:
 * present
 * paused
 * noise
 * absent
 * collapsed
 */

const PRESENCE_TTL_SECONDS = 60 * 60 * 24 * 7;
const INDEX_TTL_SECONDS = 60 * 60 * 24 * 30;
const MAX_INDEX_ITEMS = 100;

const ALLOWED_STATES = new Set([
  "present",
  "paused",
  "noise",
  "absent",
  "collapsed"
]);

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
  "internal",
  "unknown"
]);

const ACTIVE_STATES = new Set([
  "present",
  "paused",
  "noise"
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

  const surface = normalizeSurface(
    body.surface ||
      body.active_surface ||
      body.activeSurface ||
      "unknown"
  );

  if (!ALLOWED_SURFACES.has(surface)) {
    return json(
      {
        ok: false,
        error: "SURFACE_NOT_ALLOWED",
        allowed: Array.from(ALLOWED_SURFACES)
      },
      400
    );
  }

  const signal = normalizeSignal(body.signal || body.presence_signal || "");
  const previous = await readPresence(env, identityId);

  const interpreted = interpretPresence({
    signal,
    body,
    previous
  });

  const now = new Date().toISOString();
  const presenceId = cleanText(previous?.id || previous?.presence_id) || makeId("SYNTHETIC_PRESENCE");

  const presence = {
    id: presenceId,
    presence_id: presenceId,

    identity_id: identityId,
    actor_identity_id: identityId,

    state: interpreted.state,
    status: interpreted.status,
    reason: interpreted.reason,

    surface,
    active_surface: surface,

    lane_lock: interpreted.lane_lock,
    sync_hold: interpreted.sync_hold,
    jitter_buffer: interpreted.jitter_buffer,
    collapse_ready: interpreted.collapse_ready,

    heartbeat_ms: cleanNumber(body.heartbeat_ms || body.heartbeatMs, 0),
    dwell_ms: cleanNumber(body.dwell_ms || body.dwellMs, 0),
    hesitation_ms: cleanNumber(body.hesitation_ms || body.hesitationMs, 0),
    idle_ms: cleanNumber(body.idle_ms || body.idleMs, 0),

    synthetic: true,
    fake_activity: false,
    human_imitation: false,
    user_decision: false,

    last_signal_at: now,
    created_at: cleanText(previous?.created_at) || now,
    updated_at: now,

    metadata: cleanMetadata(body.metadata)
  };

  await env.IDENTITY.put("presence:" + identityId, JSON.stringify(presence), {
    expirationTtl: PRESENCE_TTL_SECONDS
  });

  await env.IDENTITY.put("synthetic-presence:" + presenceId, JSON.stringify(presence), {
    expirationTtl: PRESENCE_TTL_SECONDS
  });

  await appendIndex(env, "synthetic-presence:index:identity:" + identityId, presenceId);
  await appendIndex(env, "synthetic-presence:index:surface:" + surface, presenceId);
  await appendIndex(env, "synthetic-presence:index:state:" + presence.state, presenceId);

  await appendSync(env, identityId, {
    type: "synthetic_presence_updated",
    presence_id: presenceId,
    state: presence.state,
    status: presence.status,
    surface,
    lane_lock: presence.lane_lock,
    sync_hold: presence.sync_hold,
    jitter_buffer: presence.jitter_buffer,
    collapse_ready: presence.collapse_ready,
    at: now
  });

  return json({
    ok: true,
    presence_id: presence.id,
    identity_id: identityId,
    state: presence.state,
    status: presence.status,
    reason: presence.reason,
    surface: presence.surface,
    lane_lock: presence.lane_lock,
    sync_hold: presence.sync_hold,
    jitter_buffer: presence.jitter_buffer,
    collapse_ready: presence.collapse_ready,
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

  const presence = await readPresence(env, identityId);

  if (!presence) {
    return json({
      ok: true,
      identity_id: identityId,
      present: false,
      state: "absent",
      status: "no_presence_record"
    });
  }

  return json({
    ok: true,
    presence: cleanPresenceForReturn(presence)
  });
}

function interpretPresence(input) {
  const signal = input.signal;
  const body = input.body || {};
  const previous = input.previous || null;

  const forcedState = normalizeState(body.state || body.presence_state || "");

  if (forcedState) {
    return buildState(forcedState, "explicit_state");
  }

  const idleMs = cleanNumber(body.idle_ms || body.idleMs, 0);
  const heartbeatMs = cleanNumber(body.heartbeat_ms || body.heartbeatMs, 0);
  const jitterMs = cleanNumber(body.jitter_ms || body.jitterMs, 0);
  const desyncMs = cleanNumber(body.desync_ms || body.desyncMs, 0);

  if (signal === "collapse" || signal === "end" || signal === "close") {
    return buildState("collapsed", "moment_closed");
  }

  if (signal === "input" || signal === "heartbeat" || signal === "focus") {
    return buildState("present", "human_signal_present");
  }

  if (signal === "pause" || signal === "hesitation") {
    return buildState("paused", "human_pause_detected");
  }

  if (signal === "blur" || signal === "away") {
    return buildState("absent", "surface_lost_focus");
  }

  if (jitterMs > 0 || desyncMs > 0 || signal === "jitter" || signal === "desync") {
    return buildState("noise", "external_noise_buffered");
  }

  if (heartbeatMs > 0 && idleMs <= 30000) {
    return buildState("present", "heartbeat_inside_active_window");
  }

  if (idleMs > 30000 && idleMs <= 180000) {
    return buildState("paused", "idle_inside_pause_window");
  }

  if (idleMs > 180000 && idleMs <= 600000) {
    return buildState("absent", "absence_window_reached");
  }

  if (idleMs > 600000) {
    return buildState("collapsed", "collapse_window_reached");
  }

  if (previous && ACTIVE_STATES.has(cleanText(previous.state).toLowerCase())) {
    return buildState("paused", "previous_presence_held");
  }

  return buildState("absent", "no_active_signal");
}

function buildState(state, reason) {
  const cleanState = ALLOWED_STATES.has(state) ? state : "absent";

  return {
    state: cleanState,
    status: ACTIVE_STATES.has(cleanState) ? "active" : cleanState,
    reason,

    lane_lock: cleanState === "present" || cleanState === "paused" || cleanState === "noise",
    sync_hold: cleanState === "present" || cleanState === "paused" || cleanState === "noise",
    jitter_buffer: cleanState === "noise",
    collapse_ready: cleanState === "absent" || cleanState === "collapsed"
  };
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

async function readPresence(env, identityId) {
  const id = cleanText(identityId);

  if (!id) return null;

  return readJsonKey(env, "presence:" + id);
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

function cleanPresenceForReturn(presence) {
  return {
    id: presence.id,
    presence_id: presence.presence_id,
    identity_id: presence.identity_id,
    state: presence.state,
    status: presence.status,
    reason: presence.reason,
    surface: presence.surface,
    active_surface: presence.active_surface,
    lane_lock: presence.lane_lock,
    sync_hold: presence.sync_hold,
    jitter_buffer: presence.jitter_buffer,
    collapse_ready: presence.collapse_ready,
    fake_activity: false,
    human_imitation: false,
    last_signal_at: presence.last_signal_at || null,
    created_at: presence.created_at || null,
    updated_at: presence.updated_at || null
  };
}

function normalizeState(value) {
  const clean = cleanText(value).toLowerCase();

  if (ALLOWED_STATES.has(clean)) {
    return clean;
  }

  return "";
}

function normalizeSignal(value) {
  return cleanText(value).toLowerCase();
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

function cleanNumber(value, fallback = 0) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.max(0, number);
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
