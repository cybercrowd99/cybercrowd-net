/**
 * functions/api/ping-delivery.js
 *
 * CyberCrowd PING Delivery
 *
 * ONE JOB:
 * Record that a PING was delivered to a surface.
 *
 * This is NOT chat.
 * This is NOT email.
 * This is NOT notification spam.
 * This is NOT the PING creator.
 *
 * Delivery means:
 * the PING already exists, and CyberCrowd placed it on a surface,
 * device, identity moment, Magic Cursor surface, or carrier lane.
 *
 * Flow:
 * ping.js creates queued PING
 *   ↓
 * magic-cursor-presence.js knows active surface
 *   ↓
 * ping-delivery.js records delivery
 *   ↓
 * ping-ack.js lets the identity act
 */

const DELIVERY_TTL_SECONDS = 60 * 60 * 24 * 30;
const INDEX_TTL_SECONDS = 60 * 60 * 24 * 90;
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
  "delivered",
  "visible",
  "queued",
  "failed",
  "missed"
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

  const pingId = cleanText(
    body.ping_id ||
    body.pingId ||
    body.id
  );

  if (!pingId) {
    return json({
      ok: false,
      error: "PING_ID_REQUIRED"
    }, 400);
  }

  const ping = await readPing(env, pingId);

  if (!ping) {
    return json({
      ok: false,
      error: "PING_NOT_FOUND"
    }, 404);
  }

  const isReceiver = ping.to_identity_id === actorIdentityId;
  const isSender = ping.from_identity_id === actorIdentityId;

  if (!isReceiver && !isSender) {
    return json({
      ok: false,
      error: "PING_ACCESS_DENIED"
    }, 403);
  }

  const surface = normalizeSurface(
    body.surface ||
    body.active_surface ||
    body.activeSurface ||
    ping.surface ||
    "unknown"
  );

  if (!ALLOWED_SURFACES.has(surface)) {
    return json({
      ok: false,
      error: "DELIVERY_SURFACE_NOT_ALLOWED",
      allowed: Array.from(ALLOWED_SURFACES)
    }, 400);
  }

  const status = cleanText(body.status || "delivered").toLowerCase();

  if (!ALLOWED_STATUS.has(status)) {
    return json({
      ok: false,
      error: "DELIVERY_STATUS_NOT_ALLOWED",
      allowed: Array.from(ALLOWED_STATUS)
    }, 400);
  }

  const now = new Date().toISOString();
  const deliveryId = cleanText(
    body.delivery_id ||
    body.deliveryId
  ) || makeId("DELIVERY");

  const delivery = {
    id: deliveryId,
    ping_id: ping.id,

    from_identity_id: ping.from_identity_id,
    to_identity_id: ping.to_identity_id,

    actor_identity_id: actorIdentityId,

    surface,
    carrier: cleanText(body.carrier) || surface,
    status,

    object_id: ping.object_id || null,
    intent_id: ping.intent_id || null,
    proximity_id: ping.proximity_id || null,

    presence_id: cleanText(body.presence_id || body.presenceId) || null,

    delivered_at: now,
    created_at: now,
    updated_at: now,

    metadata: cleanMetadata(body.metadata)
  };

  await env.IDENTITY.put(
    "ping-delivery:" + delivery.id,
    JSON.stringify(delivery),
    {
      expirationTtl: DELIVERY_TTL_SECONDS
    }
  );

  await appendIndex(env, "ping-delivery:index:ping:" + ping.id, delivery.id);
  await appendIndex(env, "ping-delivery:index:to:" + ping.to_identity_id, delivery.id);
  await appendIndex(env, "ping-delivery:index:surface:" + surface, delivery.id);

  ping.status = status === "failed" ? "delivery_failed" : "delivered";
  ping.delivered_at = now;
  ping.delivery_id = delivery.id;
  ping.surface = surface;
  ping.updated_at = now;

  await env.IDENTITY.put(
    "ping:" + ping.id,
    JSON.stringify(ping),
    {
      expirationTtl: DELIVERY_TTL_SECONDS
    }
  );

  await appendSync(env, ping.id, {
    type: "ping_delivered",
    ping_id: ping.id,
    delivery_id: delivery.id,
    surface,
    carrier: delivery.carrier,
    status: delivery.status,
    to_identity_id: ping.to_identity_id,
    from_identity_id: ping.from_identity_id,
    at: now
  });

  await appendSync(env, ping.to_identity_id, {
    type: "identity_ping_delivered",
    ping_id: ping.id,
    delivery_id: delivery.id,
    surface,
    carrier: delivery.carrier,
    status: delivery.status,
    from_identity_id: ping.from_identity_id,
    object_id: ping.object_id || null,
    at: now
  });

  await appendSync(env, ping.from_identity_id, {
    type: "sent_ping_delivered",
    ping_id: ping.id,
    delivery_id: delivery.id,
    surface,
    carrier: delivery.carrier,
    status: delivery.status,
    to_identity_id: ping.to_identity_id,
    object_id: ping.object_id || null,
    at: now
  });

  if (ping.object_id) {
    await appendSync(env, ping.object_id, {
      type: "object_ping_delivered",
      ping_id: ping.id,
      delivery_id: delivery.id,
      surface,
      carrier: delivery.carrier,
      status: delivery.status,
      at: now
    });
  }

  return json({
    ok: true,
    created: true,
    delivery_id: delivery.id,
    ping_id: ping.id,
    surface: delivery.surface,
    carrier: delivery.carrier,
    status: delivery.status,
    from_identity_id: delivery.from_identity_id,
    to_identity_id: delivery.to_identity_id,
    object_id: delivery.object_id,
    intent_id: delivery.intent_id,
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

  const url = new URL(request.url);

  const pingId = cleanText(
    url.searchParams.get("ping_id") ||
    url.searchParams.get("pingId")
  );

  if (!pingId) {
    return json({
      ok: false,
      error: "PING_ID_REQUIRED"
    }, 400);
  }

  const ping = await readPing(env, pingId);

  if (!ping) {
    return json({
      ok: false,
      error: "PING_NOT_FOUND"
    }, 404);
  }

  if (ping.to_identity_id !== identityId && ping.from_identity_id !== identityId) {
    return json({
      ok: false,
      error: "PING_ACCESS_DENIED"
    }, 403);
  }

  const ids = await readIndex(env, "ping-delivery:index:ping:" + ping.id);
  const deliveries = [];

  for (const id of ids) {
    const delivery = await readDelivery(env, id);

    if (!delivery) continue;

    deliveries.push(cleanDeliveryForReturn(delivery));
  }

  return json({
    ok: true,
    ping_id: ping.id,
    count: deliveries.length,
    deliveries
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

async function readPing(env, pingId) {
  const id = cleanText(pingId);

  if (!id) {
    return null;
  }

  const raw = await env.IDENTITY.get("ping:" + id);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function readDelivery(env, deliveryId) {
  const id = cleanText(deliveryId);

  if (!id) {
    return null;
  }

  const raw = await env.IDENTITY.get("ping-delivery:" + id);

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

function cleanDeliveryForReturn(delivery) {
  return {
    id: delivery.id,
    ping_id: delivery.ping_id,
    from_identity_id: delivery.from_identity_id,
    to_identity_id: delivery.to_identity_id,
    actor_identity_id: delivery.actor_identity_id,
    surface: delivery.surface,
    carrier: delivery.carrier,
    status: delivery.status,
    object_id: delivery.object_id || null,
    intent_id: delivery.intent_id || null,
    proximity_id: delivery.proximity_id || null,
    presence_id: delivery.presence_id || null,
    delivered_at: delivery.delivered_at || null,
    created_at: delivery.created_at || null,
    updated_at: delivery.updated_at || null
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
