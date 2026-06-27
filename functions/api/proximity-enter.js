/**
 * functions/api/proximity-enter.js
 *
 * CyberCrowd Proximity Enter
 *
 * ONE JOB:
 * When an object enters an identity field,
 * decide whether one PING should be created.
 *
 * This is NOT search.
 * This is NOT a demo.
 * This is NOT notification spam.
 * This is not the Carrier.
 *
 * Proximity means:
 * an object, service, offer, tool, event, job, product, or proof
 * crossed close enough to a remembered intent or I CAN field
 * to justify one relevant movement.
 */

const INTENT_INDEX_LIMIT = 100;
const INDEX_TTL_SECONDS = 60 * 60 * 24 * 90;
const PROXIMITY_EVENT_TTL_SECONDS = 60 * 60 * 24 * 30;

const DEFAULT_RADIUS_MILES = 5;

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

  const object = normalizeObject(body.object || body);

  if (!object.owner_identity_id) {
    return json({
      ok: false,
      error: "OBJECT_OWNER_IDENTITY_REQUIRED"
    }, 400);
  }

  if (!object.title && object.tags.length === 0) {
    return json({
      ok: false,
      error: "OBJECT_TITLE_OR_TAGS_REQUIRED"
    }, 400);
  }

  const fieldIdentityId = cleanText(
    body.field_identity_id ||
    body.fieldIdentityId ||
    body.identity_id ||
    body.identityId ||
    observerIdentityId
  );

  if (!fieldIdentityId) {
    return json({
      ok: false,
      error: "FIELD_IDENTITY_REQUIRED"
    }, 400);
  }

  if (object.owner_identity_id === fieldIdentityId) {
    return json({
      ok: true,
      created: false,
      reason: "SELF_PROXIMITY_IGNORED",
      field_identity_id: fieldIdentityId,
      object
    });
  }

  const intentIds = await readIndex(env, "intent:index:" + fieldIdentityId);
  const intents = await readIntents(env, intentIds);

  const decision = decideProximity({
    object,
    intents,
    fieldIdentityId
  });

  const now = new Date().toISOString();
  const eventId = makeId("PROXIMITY");

  const event = {
    id: eventId,
    field_identity_id: fieldIdentityId,
    observer_identity_id: observerIdentityId,
    object,
    decision,
    created_at: now
  };

  await env.IDENTITY.put(
    "proximity:" + event.id,
    JSON.stringify(event),
    {
      expirationTtl: PROXIMITY_EVENT_TTL_SECONDS
    }
  );

  await appendSync(env, fieldIdentityId, {
    type: "object_entered_field",
    proximity_id: event.id,
    object_id: object.id,
    owner_identity_id: object.owner_identity_id,
    decision: decision.create_ping ? "create_ping" : "no_ping",
    reason: decision.reason,
    at: now
  });

  if (object.id) {
    await appendSync(env, object.id, {
      type: "object_entered_identity_field",
      proximity_id: event.id,
      field_identity_id: fieldIdentityId,
      decision: decision.create_ping ? "create_ping" : "no_ping",
      reason: decision.reason,
      at: now
    });
  }

  if (!decision.create_ping) {
    return json({
      ok: true,
      created: false,
      proximity_id: event.id,
      field_identity_id: fieldIdentityId,
      object_id: object.id,
      reason: decision.reason,
      match: decision.match || null
    });
  }

  const pingId = makeId("PING");

  const ping = {
    id: pingId,
    kind: "proximity_match",
    free: true,

    from_identity_id: fieldIdentityId,
    to_identity_id: object.owner_identity_id,

    object_id: object.id || null,
    intent_id: decision.intent_id || null,
    proximity_id: event.id,

    reason: decision.reason,
    surface: cleanText(body.surface || body.magic_cursor_surface) || null,

    status: "queued",
    created_at: now,
    updated_at: now,

    metadata: cleanMetadata({
      ...body.metadata,
      object_title: object.title,
      object_type: object.type,
      match_score: decision.match ? decision.match.score : null,
      distance_miles: decision.match ? decision.match.distance_miles : null
    })
  };

  await env.IDENTITY.put(
    "ping:" + ping.id,
    JSON.stringify(ping),
    {
      expirationTtl: PROXIMITY_EVENT_TTL_SECONDS
    }
  );

  await appendIndex(env, "ping:index:from:" + ping.from_identity_id, ping.id);
  await appendIndex(env, "ping:index:to:" + ping.to_identity_id, ping.id);

  await appendSync(env, ping.id, {
    type: "ping_created_from_proximity",
    ping_id: ping.id,
    proximity_id: event.id,
    from_identity_id: ping.from_identity_id,
    to_identity_id: ping.to_identity_id,
    object_id: ping.object_id,
    intent_id: ping.intent_id,
    at: now
  });

  await appendSync(env, fieldIdentityId, {
    type: "proximity_ping_sent",
    ping_id: ping.id,
    proximity_id: event.id,
    to_identity_id: ping.to_identity_id,
    object_id: ping.object_id,
    intent_id: ping.intent_id,
    at: now
  });

  await appendSync(env, object.owner_identity_id, {
    type: "proximity_ping_received",
    ping_id: ping.id,
    proximity_id: event.id,
    from_identity_id: ping.from_identity_id,
    object_id: ping.object_id,
    intent_id: ping.intent_id,
    at: now
  });

  return json({
    ok: true,
    created: true,
    proximity_id: event.id,
    ping_id: ping.id,
    kind: ping.kind,
    free: ping.free,
    field_identity_id: fieldIdentityId,
    from_identity_id: ping.from_identity_id,
    to_identity_id: ping.to_identity_id,
    object_id: ping.object_id,
    intent_id: ping.intent_id,
    reason: ping.reason,
    status: ping.status,
    match: decision.match || null
  });
}

function decideProximity(input) {
  const object = input.object;
  const intents = Array.isArray(input.intents) ? input.intents : [];

  if (object.status && object.status !== "available") {
    return {
      create_ping: false,
      reason: "OBJECT_NOT_AVAILABLE"
    };
  }

  let best = null;

  for (const intent of intents) {
    if (!intent || intent.active === false) continue;

    const match = matchIntentToObject(intent, object);

    if (!match.matched) continue;

    if (!best || match.score > best.match.score) {
      best = {
        intent,
        match
      };
    }
  }

  if (!best) {
    return {
      create_ping: false,
      reason: "NO_RELEVANT_INTENT_FOUND"
    };
  }

  return {
    create_ping: true,
    reason: "OBJECT_ENTERED_RELEVANT_PROXIMITY",
    intent_id: best.intent.id || null,
    match: {
      score: best.match.score,
      matched_terms: best.match.matched_terms,
      distance_miles: best.match.distance_miles,
      radius_miles: best.match.radius_miles
    }
  };
}

function matchIntentToObject(intent, object) {
  const intentTerms = new Set([
    ...words(intent.phrase),
    ...normalizeTags(intent.tags)
  ]);

  const objectTerms = new Set([
    ...words(object.title),
    ...words(object.type),
    ...normalizeTags(object.tags)
  ]);

  const matchedTerms = [];

  intentTerms.forEach((term) => {
    if (objectTerms.has(term)) {
      matchedTerms.push(term);
    }
  });

  if (matchedTerms.length === 0) {
    return {
      matched: false,
      score: 0,
      reason: "NO_TERM_MATCH"
    };
  }

  const radiusMiles = Number(intent.radius_miles || intent.radiusMiles) || DEFAULT_RADIUS_MILES;
  const distance = milesBetween(normalizeArea(intent.area), object.area);

  if (Number.isFinite(distance) && distance > radiusMiles) {
    return {
      matched: false,
      score: matchedTerms.length,
      reason: "OUTSIDE_RADIUS",
      distance_miles: round(distance),
      radius_miles: radiusMiles
    };
  }

  return {
    matched: true,
    score: matchedTerms.length,
    matched_terms: matchedTerms,
    distance_miles: Number.isFinite(distance) ? round(distance) : null,
    radius_miles: radiusMiles
  };
}

function normalizeObject(input) {
  const object = input && typeof input === "object" ? input : {};

  return {
    id: cleanText(object.id || object.object_id || object.objectId) || makeId("OBJ"),
    owner_identity_id: cleanText(
      object.owner_identity_id ||
      object.ownerIdentityId ||
      object.to_identity_id ||
      object.toIdentityId
    ),
    title: cleanText(object.title || object.name),
    type: cleanText(object.type || object.kind) || "object",
    tags: normalizeTags(object.tags || object.keywords),
    area: normalizeArea(object.area),
    status: cleanText(object.status) || "available",
    metadata: cleanMetadata(object.metadata)
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

async function readIntents(env, ids) {
  const found = [];

  for (const id of ids.slice(0, INTENT_INDEX_LIMIT)) {
    const raw = await env.IDENTITY.get("intent:" + id);

    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw);
      found.push(parsed);
    } catch {
      continue;
    }
  }

  return found;
}

async function appendIndex(env, key, value) {
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
  list = list.slice(0, INTENT_INDEX_LIMIT);

  await env.IDENTITY.put(
    key,
    JSON.stringify(list),
    {
      expirationTtl: INDEX_TTL_SECONDS
    }
  );
}

async function appendSync(env, targetId, event) {
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

  trail = trail.slice(0, INTENT_INDEX_LIMIT);

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

function words(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
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

function milesBetween(a, b) {
  if (!a || !b) return Infinity;
  if (!Number.isFinite(a.lat) || !Number.isFinite(a.lng)) return Infinity;
  if (!Number.isFinite(b.lat) || !Number.isFinite(b.lng)) return Infinity;

  const earthMiles = 3958.7613;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  return 2 * earthMiles * Math.asin(Math.sqrt(h));
}

function toRad(value) {
  return value * Math.PI / 180;
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

function round(value) {
  return Math.round(value * 100) / 100;
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
