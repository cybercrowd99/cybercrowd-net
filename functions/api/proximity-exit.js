/**
 * functions/api/proximity-exit.js
 *
 * CyberCrowd Proximity Exit
 *
 * ONE JOB:
 * When an object leaves an identity field,
 * record the exit and close the active proximity moment.
 *
 * This is NOT search.
 * This is NOT notification spam.
 * This is NOT the Carrier.
 * This does NOT create a PING.
 *
 * Exit means:
 * the object, service, offer, tool, event, job, product, or proof
 * moved far enough away that the proximity moment should end.
 */

const PROXIMITY_EVENT_TTL_SECONDS = 60 * 60 * 24 * 30;
const INDEX_TTL_SECONDS = 60 * 60 * 24 * 90;
const MAX_SYNC_ITEMS = 100;

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

  const proximityId = cleanText(
    body.proximity_id ||
    body.proximityId
  );

  const objectId = cleanText(
    body.object_id ||
    body.objectId ||
    body.object?.id ||
    body.object?.object_id ||
    body.object?.objectId
  );

  if (!proximityId && !objectId) {
    return json({
      ok: false,
      error: "PROXIMITY_ID_OR_OBJECT_ID_REQUIRED"
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

  const now = new Date().toISOString();
  const exitId = makeId("PROXIMITY_EXIT");

  let proximity = null;

  if (proximityId) {
    proximity = await readProximity(env, proximityId);

    if (!proximity) {
      return json({
        ok: false,
        error: "PROXIMITY_NOT_FOUND"
      }, 404);
    }

    if (proximity.field_identity_id !== fieldIdentityId) {
      return json({
        ok: false,
        error: "PROXIMITY_FIELD_MISMATCH"
      }, 403);
    }
  }

  const object = normalizeObject(
    body.object ||
    proximity?.object ||
    {
      id: objectId,
      owner_identity_id:
        body.owner_identity_id ||
        body.ownerIdentityId ||
        proximity?.object?.owner_identity_id ||
        proximity?.object?.ownerIdentityId
    }
  );

  if (!object.id) {
    return json({
      ok: false,
      error: "OBJECT_ID_REQUIRED"
    }, 400);
  }

  if (!object.owner_identity_id) {
    return json({
      ok: false,
      error: "OBJECT_OWNER_IDENTITY_REQUIRED"
    }, 400);
  }

  const exitEvent = {
    id: exitId,
    proximity_id: proximityId || null,
    field_identity_id: fieldIdentityId,
    observer_identity_id: observerIdentityId,
    object,
    reason: cleanText(body.reason) || "OBJECT_LEFT_FIELD",
    created_at: now,
    metadata: cleanMetadata(body.metadata)
  };

  await env.IDENTITY.put(
    "proximity-exit:" + exitEvent.id,
    JSON.stringify(exitEvent),
    {
      expirationTtl: PROXIMITY_EVENT_TTL_SECONDS
    }
  );

  if (proximity) {
    proximity.status = "exited";
    proximity.exited_at = now;
    proximity.proximity_exit_id = exitEvent.id;
    proximity.exit_reason = exitEvent.reason;
    proximity.updated_at = now;

    await env.IDENTITY.put(
      "proximity:" + proximity.id,
      JSON.stringify(proximity),
      {
        expirationTtl: PROXIMITY_EVENT_TTL_SECONDS
      }
    );
  }

  await appendSync(env, fieldIdentityId, {
    type: "object_left_field",
    proximity_exit_id: exitEvent.id,
    proximity_id: proximityId || null,
    object_id: object.id,
    owner_identity_id: object.owner_identity_id,
    reason: exitEvent.reason,
    at: now
  });

  await appendSync(env, object.id, {
    type: "object_left_identity_field",
    proximity_exit_id: exitEvent.id,
    proximity_id: proximityId || null,
    field_identity_id: fieldIdentityId,
    reason: exitEvent.reason,
    at: now
  });

  await appendSync(env, object.owner_identity_id, {
    type: "owned_object_left_field",
    proximity_exit_id: exitEvent.id,
    proximity_id: proximityId || null,
    object_id: object.id,
    field_identity_id: fieldIdentityId,
    reason: exitEvent.reason,
    at: now
  });

  if (proximityId) {
    await appendSync(env, proximityId, {
      type: "proximity_moment_closed",
      proximity_exit_id: exitEvent.id,
      object_id: object.id,
      field_identity_id: fieldIdentityId,
      reason: exitEvent.reason,
      at: now
    });
  }

  return json({
    ok: true,
    created: true,
    closed: Boolean(proximity),
    proximity_exit_id: exitEvent.id,
    proximity_id: proximityId || null,
    field_identity_id: fieldIdentityId,
    object_id: object.id,
    owner_identity_id: object.owner_identity_id,
    reason: exitEvent.reason,
    status: proximity ? "exited" : "exit_recorded",
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

async function readProximity(env, proximityId) {
  const raw = await env.IDENTITY.get("proximity:" + proximityId);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
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

function normalizeObject(input) {
  const object = input && typeof input === "object" ? input : {};

  return {
    id: cleanText(
      object.id ||
      object.object_id ||
      object.objectId
    ),
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
