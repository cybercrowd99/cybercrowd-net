/**
 * functions/api/carrier-route.js
 *
 * CyberCrowd Carrier Route
 *
 * ONE JOB:
 * Choose the best surface or carrier for an existing PING.
 *
 * This is NOT chat.
 * This is NOT email.
 * This is NOT notification spam.
 * This does NOT create a PING.
 * This does NOT record final delivery.
 *
 * Carrier Route means:
 * the PING already exists, and CyberCrowd decides where
 * the relevant movement should be placed next.
 *
 * Flow:
 * ping.js creates queued PING
 *   ↓
 * magic-cursor-presence.js knows active surface
 *   ↓
 * carrier-route.js chooses a carrier / surface
 *   ↓
 * ping-delivery.js records delivery
 *   ↓
 * ping-ack.js lets identity act
 */

const ROUTE_TTL_SECONDS = 60 * 60 * 24 * 30;
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
  "selected",
  "deferred",
  "blocked",
  "failed"
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

  const isSender = ping.from_identity_id === actorIdentityId;
  const isReceiver = ping.to_identity_id === actorIdentityId;

  if (!isSender && !isReceiver) {
    return json({
      ok: false,
      error: "PING_ACCESS_DENIED"
    }, 403);
  }

  const toIdentityId = cleanText(ping.to_identity_id);

  if (!toIdentityId) {
    return json({
      ok: false,
      error: "PING_TARGET_IDENTITY_MISSING"
    }, 500);
  }

  const preferredSurface = normalizeSurface(
    body.surface ||
    body.preferred_surface ||
    body.preferredSurface ||
    ping.surface ||
    ""
  );

  const presence = await readPresence(env, toIdentityId);

  const routeDecision = decideRoute({
    ping,
    presence,
    preferredSurface,
    body
  });

  const status = routeDecision.status;

  if (!ALLOWED_STATUS.has(status)) {
    return json({
      ok: false,
      error: "ROUTE_STATUS_NOT_ALLOWED"
    }, 500);
  }

  const now = new Date().toISOString();
  const routeId = cleanText(
    body.route_id ||
    body.routeId
  ) || makeId("CARRIER_ROUTE");

  const route = {
    id: routeId,
    ping_id: ping.id,

    from_identity_id: ping.from_identity_id,
    to_identity_id: ping.to_identity_id,
    actor_identity_id: actorIdentityId,

    surface: routeDecision.surface,
    carrier: routeDecision.carrier,
    status: routeDecision.status,
    reason: routeDecision.reason,

    presence_id: presence?.id || null,

    object_id: ping.object_id || null,
    intent_id: ping.intent_id || null,
    proximity_id: ping.proximity_id || null,

    created_at: now,
    updated_at: now,

    metadata: cleanMetadata(body.metadata)
  };

  await env.IDENTITY.put(
    "carrier-route:" + route.id,
    JSON.stringify(route),
    {
      expirationTtl: ROUTE_TTL_SECONDS
    }
  );

  await appendIndex(env, "carrier-route:index:ping:" + ping.id, route.id);
  await appendIndex(env, "carrier-route:index:to:" + toIdentityId, route.id);
  await appendIndex(env, "carrier-route:index:surface:" + route.surface, route.id);

  ping.route_id = route.id;
  ping.surface = route.surface;
  ping.carrier = route.carrier;
  ping.route_status = route.status;
  ping.route_reason = route.reason;
  ping.routed_at = now;
  ping.updated_at = now;

  if (ping.status === "queued" || ping.status === "created") {
    ping.status = "routed";
  }

  await env.IDENTITY.put(
    "ping:" + ping.id,
    JSON.stringify(ping),
    {
      expirationTtl: ROUTE_TTL_SECONDS
    }
  );

  await appendSync(env, ping.id, {
    type: "ping_carrier_route_selected",
    ping_id: ping.id,
    carrier_route_id: route.id,
    surface: route.surface,
    carrier: route.carrier,
    status: route.status,
    reason: route.reason,
    to_identity_id: toIdentityId,
    from_identity_id: ping.from_identity_id,
    at: now
  });

  await appendSync(env, toIdentityId, {
    type: "identity_ping_route_selected",
    ping_id: ping.id,
    carrier_route_id: route.id,
    surface: route.surface,
    carrier: route.carrier,
    status: route.status,
    reason: route.reason,
    from_identity_id: ping.from_identity_id,
    object_id: ping.object_id || null,
    at: now
  });

  await appendSync(env, ping.from_identity_id, {
    type: "sent_ping_route_selected",
    ping_id: ping.id,
    carrier_route_id: route.id,
    surface: route.surface,
    carrier: route.carrier,
    status: route.status,
    reason: route.reason,
    to_identity_id: toIdentityId,
    object_id: ping.object_id || null,
    at: now
  });

  if (ping.object_id) {
    await appendSync(env, ping.object_id, {
      type: "object_ping_route_selected",
      ping_id: ping.id,
      carrier_route_id: route.id,
      surface: route.surface,
      carrier: route.carrier,
      status: route.status,
      reason: route.reason,
      at: now
    });
  }

  return json({
    ok: true,
    created: true,
    carrier_route_id: route.id,
    ping_id: ping.id,
    surface: route.surface,
    carrier: route.carrier,
    status: route.status,
    reason: route.reason,
    from_identity_id: route.from_identity_id,
    to_identity_id: route.to_identity_id,
    object_id: route.object_id,
    intent_id: route.intent_id,
    proximity_id: route.proximity_id,
    ping_created: false,
    delivered: false,
    next: {
      route: "/api/ping-delivery",
      method: "POST",
      reason: "carrier_route_selected"
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

  const ids = await readIndex(env, "carrier-route:index:ping:" + ping.id);
  const routes = [];

  for (const id of ids) {
    const route = await readCarrierRoute(env, id);

    if (!route) continue;

    routes.push(cleanRouteForReturn(route));
  }

  return json({
    ok: true,
    ping_id: ping.id,
    count: routes.length,
    routes
  });
}

function decideRoute(input) {
  const ping = input.ping;
  const presence = input.presence;
  const preferredSurface = input.preferredSurface;
  const body = input.body || {};

  if (preferredSurface && ALLOWED_SURFACES.has(preferredSurface)) {
    return {
      surface: preferredSurface,
      carrier: cleanText(body.carrier) || preferredSurface,
      status: "selected",
      reason: "preferred_surface_requested"
    };
  }

  const presenceSurface = normalizeSurface(
    presence?.surface ||
    presence?.active_surface ||
    presence?.activeSurface ||
    ""
  );

  if (presence && presence.status === "active" && ALLOWED_SURFACES.has(presenceSurface)) {
    return {
      surface: presenceSurface,
      carrier: cleanText(body.carrier) || presenceSurface,
      status: "selected",
      reason: "magic_cursor_active_surface"
    };
  }

  const pingSurface = normalizeSurface(ping.surface || "");

  if (pingSurface && ALLOWED_SURFACES.has(pingSurface)) {
    return {
      surface: pingSurface,
      carrier: cleanText(body.carrier) || pingSurface,
      status: "selected",
      reason: "ping_existing_surface"
    };
  }

  return {
    surface: "internal",
    carrier: cleanText(body.carrier) || "internal",
    status: "selected",
    reason: "fallback_internal_surface"
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

async function readPresence(env, identityId) {
  const id = cleanText(identityId);

  if (!id) {
    return null;
  }

  const raw = await env.IDENTITY.get("presence:" + id);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function readCarrierRoute(env, routeId) {
  const id = cleanText(routeId);

  if (!id) {
    return null;
  }

  const raw = await env.IDENTITY.get("carrier-route:" + id);

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

function cleanRouteForReturn(route) {
  return {
    id: route.id,
    ping_id: route.ping_id,
    from_identity_id: route.from_identity_id,
    to_identity_id: route.to_identity_id,
    actor_identity_id: route.actor_identity_id,
    surface: route.surface,
    carrier: route.carrier,
    status: route.status,
    reason: route.reason,
    presence_id: route.presence_id || null,
    object_id: route.object_id || null,
    intent_id: route.intent_id || null,
    proximity_id: route.proximity_id || null,
    created_at: route.created_at || null,
    updated_at: route.updated_at || null
  };
}

function normalizeSurface(value) {
  const clean = cleanText(value).toLowerCase();

  if (!clean) return "";

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
