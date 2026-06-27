/**
 * functions/api/shot-classify.js
 *
 * CyberCrowd Shot Classify
 *
 * ONE JOB:
 * Classify a camera/event shot into a CyberCrowd object, event, or evidence moment.
 *
 * This is NOT surveillance.
 * This is NOT chat.
 * This is NOT email.
 * This is NOT notification spam.
 * This does NOT create a PING.
 *
 * Shot means:
 * hardware captured a moment.
 *
 * Camera / device / event hardware creates the shot.
 * CyberCrowd classifies the shot so it can become:
 * - object evidence
 * - event evidence
 * - identity evidence
 * - service evidence
 * - proximity input
 * - object-link input
 *
 * Flow:
 * camera captures shot
 *   ↓
 * shot-classify.js classifies the moment
 *   ↓
 * object-link.js may resolve an object handle
 *   ↓
 * proximity-enter.js decides if it matters
 *   ↓
 * ping.js creates one PING if relevant
 */

const SHOT_TTL_SECONDS = 60 * 60 * 24 * 30;
const INDEX_TTL_SECONDS = 60 * 60 * 24 * 90;
const MAX_SYNC_ITEMS = 100;

const ALLOWED_CLASSES = new Set([
  "object",
  "event",
  "identity",
  "service",
  "evidence",
  "unknown"
]);

const ALLOWED_HARDWARE = new Set([
  "camera",
  "phone_camera",
  "door_camera",
  "vehicle_camera",
  "xr_camera",
  "pos_camera",
  "scanner",
  "manual"
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

  const observerIdentityId = cleanText(
    session.identity_id ||
    session.identityId ||
    session.idl ||
    session.email
  );

  if (!observerIdentityId) {
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

  const hardware = normalizeHardware(
    body.hardware ||
    body.device ||
    body.capture_device ||
    body.captureDevice ||
    "camera"
  );

  if (!ALLOWED_HARDWARE.has(hardware)) {
    return json({
      ok: false,
      error: "SHOT_HARDWARE_NOT_ALLOWED",
      allowed: Array.from(ALLOWED_HARDWARE)
    }, 400);
  }

  const shotClass = normalizeClass(
    body.class ||
    body.shot_class ||
    body.shotClass ||
    body.kind ||
    "unknown"
  );

  if (!ALLOWED_CLASSES.has(shotClass)) {
    return json({
      ok: false,
      error: "SHOT_CLASS_NOT_ALLOWED",
      allowed: Array.from(ALLOWED_CLASSES)
    }, 400);
  }

  const ownerIdentityId = cleanText(
    body.owner_identity_id ||
    body.ownerIdentityId ||
    body.provider_identity_id ||
    body.providerIdentityId ||
    observerIdentityId
  );

  if (!ownerIdentityId) {
    return json({
      ok: false,
      error: "OWNER_IDENTITY_REQUIRED"
    }, 400);
  }

  const shotId = cleanText(
    body.shot_id ||
    body.shotId ||
    body.id
  ) || makeId("SHOT");

  const now = new Date().toISOString();

  const shot = {
    id: shotId,
    class: shotClass,

    hardware,
    source: cleanText(body.source) || "hardware_capture",
    provider: cleanText(body.provider || body.vendor) || null,

    observer_identity_id: observerIdentityId,
    owner_identity_id: ownerIdentityId,

    object_id: cleanText(body.object_id || body.objectId) || null,
    object_handle: cleanHandle(body.object_handle || body.objectHandle || body.handle) || null,

    event_id: cleanText(body.event_id || body.eventId) || null,
    event_handle: cleanHandle(body.event_handle || body.eventHandle) || null,

    evidence_id: cleanText(body.evidence_id || body.evidenceId) || null,
    identity_id: cleanText(body.identity_id || body.identityId) || null,
    service_id: cleanText(body.service_id || body.serviceId) || null,

    title: cleanText(body.title || body.name) || null,
    description: cleanText(body.description || body.note) || null,

    image_url: cleanText(
      body.image_url ||
      body.imageUrl ||
      body.photo_url ||
      body.photoUrl ||
      body.snapshot_url ||
      body.snapshotUrl
    ) || null,

    link_url: cleanText(
      body.link_url ||
      body.linkUrl ||
      body.url ||
      body.href
    ) || null,

    area: normalizeArea(body.area),
    tags: normalizeTags(body.tags || body.keywords),

    confidence: normalizeConfidence(body.confidence),

    status: "classified",
    created_at: now,
    updated_at: now,

    metadata: cleanMetadata(body.metadata)
  };

  await env.IDENTITY.put(
    "shot:" + shot.id,
    JSON.stringify(shot),
    {
      expirationTtl: SHOT_TTL_SECONDS
    }
  );

  await appendIndex(env, "shot:index:owner:" + shot.owner_identity_id, shot.id);
  await appendIndex(env, "shot:index:observer:" + shot.observer_identity_id, shot.id);
  await appendIndex(env, "shot:index:class:" + shot.class, shot.id);

  if (shot.object_id) {
    await appendIndex(env, "shot:index:object:" + shot.object_id, shot.id);
  }

  if (shot.event_id) {
    await appendIndex(env, "shot:index:event:" + shot.event_id, shot.id);
  }

  await appendSync(env, shot.id, {
    type: "shot_classified",
    shot_id: shot.id,
    class: shot.class,
    hardware: shot.hardware,
    owner_identity_id: shot.owner_identity_id,
    observer_identity_id: shot.observer_identity_id,
    object_id: shot.object_id,
    event_id: shot.event_id,
    at: now
  });

  await appendSync(env, shot.owner_identity_id, {
    type: "owned_shot_classified",
    shot_id: shot.id,
    class: shot.class,
    hardware: shot.hardware,
    object_id: shot.object_id,
    event_id: shot.event_id,
    at: now
  });

  await appendSync(env, shot.observer_identity_id, {
    type: "shot_observed",
    shot_id: shot.id,
    class: shot.class,
    hardware: shot.hardware,
    owner_identity_id: shot.owner_identity_id,
    object_id: shot.object_id,
    event_id: shot.event_id,
    at: now
  });

  if (shot.object_id) {
    await appendSync(env, shot.object_id, {
      type: "object_shot_attached",
      shot_id: shot.id,
      class: shot.class,
      hardware: shot.hardware,
      owner_identity_id: shot.owner_identity_id,
      at: now
    });
  }

  if (shot.event_id) {
    await appendSync(env, shot.event_id, {
      type: "event_shot_attached",
      shot_id: shot.id,
      class: shot.class,
      hardware: shot.hardware,
      owner_identity_id: shot.owner_identity_id,
      at: now
    });
  }

  const next = nextRouteForShot(shot);

  return json({
    ok: true,
    created: true,
    shot_id: shot.id,
    class: shot.class,
    hardware: shot.hardware,
    owner_identity_id: shot.owner_identity_id,
    observer_identity_id: shot.observer_identity_id,
    object_id: shot.object_id,
    object_handle: shot.object_handle,
    event_id: shot.event_id,
    event_handle: shot.event_handle,
    evidence_id: shot.evidence_id,
    image_url: shot.image_url,
    link_url: shot.link_url,
    status: shot.status,
    ping_created: false,
    next
  });
}

function nextRouteForShot(shot) {
  if (shot.object_handle || shot.object_id) {
    return {
      route: "/api/object-link",
      method: "POST",
      reason: "shot_has_object_handle_or_object_id"
    };
  }

  if (shot.class === "object") {
    return {
      route: "/api/object-link",
      method: "POST",
      reason: "shot_classified_as_object"
    };
  }

  if (shot.class === "event") {
    return {
      route: "/api/proximity-enter",
      method: "POST",
      reason: "shot_classified_as_event_moment"
    };
  }

  if (shot.class === "evidence") {
    return {
      route: "/api/proximity-enter",
      method: "POST",
      reason: "shot_classified_as_evidence_moment"
    };
  }

  return {
    route: null,
    method: null,
    reason: "shot_recorded_no_next_route"
  };
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

function normalizeClass(value) {
  const clean = cleanText(value).toLowerCase();

  if (!clean) return "unknown";

  if (clean === "item") return "object";
  if (clean === "product") return "object";
  if (clean === "sale") return "object";
  if (clean === "proof") return "evidence";
  if (clean === "capture") return "evidence";
  if (clean === "job") return "service";

  return clean;
}

function normalizeHardware(value) {
  const clean = cleanText(value).toLowerCase();

  if (!clean) return "camera";

  if (clean === "cam") return "camera";
  if (clean === "phone") return "phone_camera";
  if (clean === "mobile") return "phone_camera";
  if (clean === "doorbell") return "door_camera";
  if (clean === "vehicle") return "vehicle_camera";
  if (clean === "xr") return "xr_camera";
  if (clean === "pos") return "pos_camera";

  return clean;
}

function normalizeConfidence(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return null;
  }

  if (number < 0) return 0;
  if (number > 1) return 1;

  return number;
}

function cleanHandle(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .trim()
    .replace(/^cc:\/\//i, "")
    .replace(/^object:/i, "")
    .replace(/^event:/i, "")
    .replace(/^shot:/i, "")
    .replace(/^obj:/i, "")
    .replace(/^\/+/, "")
    .toLowerCase();
}

function cleanText(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function normalizeTags(value) {
  if (!value) return [];

  const list = Array.isArray(value)
    ? value
    : String(value).split(",");

  return Array.from(
    new Set(
      list
        .map((item) => String(item).trim().toLowerCase())
        .filter(Boolean)
    )
  );
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
