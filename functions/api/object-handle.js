/**
 * functions/api/object-handle.js
 *
 * CyberCrowd Object Handle
 *
 * ONE JOB:
 * Create or update the CyberCrowd object handle an item carries.
 *
 * This is NOT search.
 * This is NOT a sale engine.
 * This is NOT the Carrier.
 * This does NOT create a PING.
 *
 * Object Handle means:
 * the item itself can carry a CyberCrowd handle.
 *
 * QR is only one costume for the handle.
 *
 * Flow:
 * item exists / waits
 *   ↓
 * object-handle.js creates the object handle
 *   ↓
 * object-link.js resolves it when touched / opened / scanned
 *   ↓
 * proximity-enter.js decides if it matters
 *   ↓
 * ping.js creates one PING if relevant
 */

const OBJECT_TTL_SECONDS = 60 * 60 * 24 * 365;
const INDEX_TTL_SECONDS = 60 * 60 * 24 * 365;
const MAX_INDEX_ITEMS = 100;

const ALLOWED_STATUS = new Set([
  "available",
  "waiting",
  "reserved",
  "sold",
  "paused",
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

  const ownerIdentityId = cleanText(
    session.identity_id ||
    session.identityId ||
    session.idl ||
    session.email
  );

  if (!ownerIdentityId) {
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

  const title = cleanText(body.title || body.name);

  if (!title) {
    return json({
      ok: false,
      error: "OBJECT_TITLE_REQUIRED"
    }, 400);
  }

  const objectId = cleanText(
    body.object_id ||
    body.objectId ||
    body.id
  ) || makeId("OBJ");

  const requestedHandle = cleanHandle(
    body.handle ||
    body.object_handle ||
    body.objectHandle
  );

  const handle = requestedHandle || makeHandle(title, objectId);

  const status = cleanText(body.status || "waiting").toLowerCase();

  if (!ALLOWED_STATUS.has(status)) {
    return json({
      ok: false,
      error: "OBJECT_STATUS_NOT_ALLOWED",
      allowed: Array.from(ALLOWED_STATUS)
    }, 400);
  }

  const now = new Date().toISOString();

  const object = {
    id: objectId,
    handle,

    owner_identity_id: ownerIdentityId,

    title,
    type: cleanText(body.type || body.kind) || "object",
    status,

    description: cleanText(body.description || body.note) || null,

    tags: normalizeTags(body.tags || body.keywords),
    area: normalizeArea(body.area),

    price: body.price || null,
    quantity: body.quantity || null,

    image_url: cleanText(
      body.image_url ||
      body.imageUrl ||
      body.photo_url ||
      body.photoUrl
    ) || null,

    url: cleanText(body.url || body.href) || null,

    created_at: now,
    updated_at: now,

    metadata: cleanMetadata(body.metadata)
  };

  const existingHandleRaw = await env.IDENTITY.get("object-handle:" + handle);

  if (existingHandleRaw) {
    const existingObjectId = await resolveHandleValue(existingHandleRaw);

    if (existingObjectId && existingObjectId !== object.id) {
      return json({
        ok: false,
        error: "OBJECT_HANDLE_ALREADY_EXISTS",
        handle,
        existing_object_id: existingObjectId
      }, 409);
    }
  }

  await env.IDENTITY.put(
    "object:" + object.id,
    JSON.stringify(object),
    {
      expirationTtl: OBJECT_TTL_SECONDS
    }
  );

  await env.IDENTITY.put(
    "object-handle:" + object.handle,
    JSON.stringify({
      object_id: object.id,
      owner_identity_id: ownerIdentityId,
      handle: object.handle,
      created_at: now
    }),
    {
      expirationTtl: OBJECT_TTL_SECONDS
    }
  );

  await appendIndex(env, "object:index:owner:" + ownerIdentityId, object.id);
  await appendIndex(env, "object:index:status:" + object.status, object.id);
  await appendIndex(env, "object:index:type:" + object.type, object.id);

  await appendSync(env, object.id, {
    type: "object_handle_created",
    object_id: object.id,
    object_handle: object.handle,
    owner_identity_id: ownerIdentityId,
    status: object.status,
    at: now
  });

  await appendSync(env, ownerIdentityId, {
    type: "owned_object_handle_created",
    object_id: object.id,
    object_handle: object.handle,
    title: object.title,
    status: object.status,
    at: now
  });

  return json({
    ok: true,
    created: true,
    object_id: object.id,
    object_handle: object.handle,
    owner_identity_id: object.owner_identity_id,
    title: object.title,
    type: object.type,
    status: object.status,
    image_url: object.image_url,
    url: object.url,
    ping_created: false,
    next: {
      route: "/api/object-link",
      method: "GET or POST",
      reason: "object_handle_ready"
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

  const url = new URL(request.url);

  const handle = cleanHandle(
    url.searchParams.get("handle") ||
    url.searchParams.get("object_handle") ||
    url.searchParams.get("h")
  );

  const objectId = cleanText(
    url.searchParams.get("object_id") ||
    url.searchParams.get("id")
  );

  if (!handle && !objectId) {
    return json({
      ok: false,
      error: "OBJECT_HANDLE_OR_OBJECT_ID_REQUIRED"
    }, 400);
  }

  let object = null;

  if (objectId) {
    object = await readObject(env, objectId);
  }

  if (!object && handle) {
    const raw = await env.IDENTITY.get("object-handle:" + handle);
    const resolvedObjectId = raw ? await resolveHandleValue(raw) : "";

    if (resolvedObjectId) {
      object = await readObject(env, resolvedObjectId);
    }
  }

  if (!object) {
    return json({
      ok: false,
      error: "OBJECT_NOT_FOUND",
      handle: handle || null,
      object_id: objectId || null
    }, 404);
  }

  return json({
    ok: true,
    object_id: object.id,
    object_handle: object.handle || handle || null,
    owner_identity_id: object.owner_identity_id,
    title: object.title,
    type: object.type,
    status: object.status,
    image_url: object.image_url || null,
    url: object.url || null,
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

async function readObject(env, objectId) {
  const id = cleanText(objectId);

  if (!id) {
    return null;
  }

  const raw =
    await env.IDENTITY.get("object:" + id) ||
    await env.IDENTITY.get("obj:" + id);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function resolveHandleValue(raw) {
  if (!raw) return "";

  try {
    const parsed = JSON.parse(raw);

    if (typeof parsed === "string") {
      return cleanText(parsed);
    }

    if (parsed && typeof parsed === "object") {
      return cleanText(
        parsed.object_id ||
        parsed.objectId ||
        parsed.id
      );
    }

    return "";
  } catch {
    return cleanText(raw);
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

function makeHandle(title, objectId) {
  const base = String(title || "object")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  const tail = String(objectId || makeId("OBJ"))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(-8);

  return (base || "object") + "-" + tail;
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
