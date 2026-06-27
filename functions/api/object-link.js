/**
 * functions/api/object-link.js
 *
 * CyberCrowd Object Link
 *
 * ONE JOB:
 * Resolve an object handle into a CyberCrowd object moment.
 *
 * This is NOT search.
 * This is NOT a sale engine.
 * This is NOT the Carrier.
 * This does NOT create a PING.
 *
 * Object Link means:
 * an item, box, photo, label, shop tile, receipt line, QR, NFC,
 * camera-recognized object, or plain link carries a CyberCrowd object handle.
 *
 * QR is only one costume for the handle.
 *
 * Flow:
 * object handle touched / scanned / opened
 *   ↓
 * object-link.js resolves the item
 *   ↓
 * proximity-enter.js decides if it matters
 *   ↓
 * ping.js creates one PING if relevant
 */

const OBJECT_MOMENT_TTL_SECONDS = 60 * 60 * 24 * 30;
const INDEX_TTL_SECONDS = 60 * 60 * 24 * 90;
const MAX_SYNC_ITEMS = 100;

export async function onRequestOptions() {
  return json({
    ok: true
  });
}

export async function onRequestGet(context) {
  return handleObjectLink(context);
}

export async function onRequestPost(context) {
  return handleObjectLink(context);
}

async function handleObjectLink(context) {
  const { request, env } = context;

  if (!env || !env.IDENTITY) {
    return json({
      ok: false,
      error: "IDENTITY_KV_MISSING"
    }, 500);
  }

  const session = await readOptionalSession(request, env);
  const viewerIdentityId = session
    ? cleanText(
        session.identity_id ||
        session.identityId ||
        session.idl ||
        session.email
      )
    : "";

  const input = await readInput(request);

  const handle = cleanHandle(
    input.handle ||
    input.object_handle ||
    input.objectHandle ||
    input.h
  );

  const objectIdInput = cleanText(
    input.object_id ||
    input.objectId ||
    input.id
  );

  if (!handle && !objectIdInput) {
    return json({
      ok: false,
      error: "OBJECT_HANDLE_OR_OBJECT_ID_REQUIRED"
    }, 400);
  }

  const resolved = await resolveObject(env, {
    handle,
    objectId: objectIdInput
  });

  if (!resolved.object) {
    return json({
      ok: false,
      error: "OBJECT_NOT_FOUND",
      handle: handle || null,
      object_id: objectIdInput || null
    }, 404);
  }

  const object = normalizeObject(resolved.object);

  if (!object.id) {
    return json({
      ok: false,
      error: "OBJECT_ID_MISSING"
    }, 500);
  }

  if (!object.owner_identity_id) {
    return json({
      ok: false,
      error: "OBJECT_OWNER_IDENTITY_MISSING"
    }, 500);
  }

  const now = new Date().toISOString();
  const momentId = makeId("OBJECT_MOMENT");

  const moment = {
    id: momentId,
    object_id: object.id,
    object_handle: resolved.handle || handle || null,
    object,
    viewer_identity_id: viewerIdentityId || null,
    source: cleanText(input.source) || detectSource(request),
    surface: cleanText(input.surface || input.magic_cursor_surface) || null,
    action: cleanText(input.action) || "opened",
    created_at: now,
    metadata: cleanMetadata(input.metadata)
  };

  await env.IDENTITY.put(
    "object-moment:" + moment.id,
    JSON.stringify(moment),
    {
      expirationTtl: OBJECT_MOMENT_TTL_SECONDS
    }
  );

  await appendIndex(env, "object-moment:index:object:" + object.id, moment.id);

  if (viewerIdentityId) {
    await appendIndex(env, "object-moment:index:viewer:" + viewerIdentityId, moment.id);
  }

  await appendSync(env, object.id, {
    type: "object_handle_opened",
    object_moment_id: moment.id,
    object_id: object.id,
    object_handle: moment.object_handle,
    viewer_identity_id: viewerIdentityId || null,
    source: moment.source,
    surface: moment.surface,
    action: moment.action,
    at: now
  });

  await appendSync(env, object.owner_identity_id, {
    type: "owned_object_handle_opened",
    object_moment_id: moment.id,
    object_id: object.id,
    object_handle: moment.object_handle,
    viewer_identity_id: viewerIdentityId || null,
    source: moment.source,
    surface: moment.surface,
    action: moment.action,
    at: now
  });

  if (viewerIdentityId) {
    await appendSync(env, viewerIdentityId, {
      type: "object_entered_view",
      object_moment_id: moment.id,
      object_id: object.id,
      object_handle: moment.object_handle,
      owner_identity_id: object.owner_identity_id,
      source: moment.source,
      surface: moment.surface,
      action: moment.action,
      at: now
    });
  }

  return json({
    ok: true,
    created: true,
    object_moment_id: moment.id,
    object_id: object.id,
    object_handle: moment.object_handle,
    owner_identity_id: object.owner_identity_id,
    viewer_identity_id: viewerIdentityId || null,
    title: object.title,
    type: object.type,
    status: object.status,
    source: moment.source,
    surface: moment.surface,
    action: moment.action,
    ping_created: false,
    next: {
      route: "/api/proximity-enter",
      method: "POST",
      reason: "object_link_resolved"
    }
  });
}

async function resolveObject(env, input) {
  const handle = cleanHandle(input.handle);
  const objectId = cleanText(input.objectId);

  if (objectId) {
    const object = await readObject(env, objectId);

    if (object) {
      return {
        object,
        handle: handle || object.handle || null
      };
    }
  }

  if (handle) {
    const rawHandle = await env.IDENTITY.get("object-handle:" + handle);

    if (rawHandle) {
      try {
        const parsed = JSON.parse(rawHandle);

        if (typeof parsed === "string") {
          const object = await readObject(env, parsed);

          return {
            object,
            handle
          };
        }

        if (parsed && typeof parsed === "object") {
          const linkedObjectId = cleanText(
            parsed.object_id ||
            parsed.objectId ||
            parsed.id
          );

          if (linkedObjectId) {
            const object = await readObject(env, linkedObjectId);

            return {
              object,
              handle
            };
          }

          return {
            object: parsed,
            handle
          };
        }
      } catch {
        const object = await readObject(env, rawHandle.trim());

        return {
          object,
          handle
        };
      }
    }

    const object = await readObject(env, handle);

    if (object) {
      return {
        object,
        handle
      };
    }
  }

  return {
    object: null,
    handle: handle || null
  };
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

async function readInput(request) {
  const url = new URL(request.url);
  const queryInput = {};

  url.searchParams.forEach((value, key) => {
    queryInput[key] = value;
  });

  if (request.method === "GET") {
    return queryInput;
  }

  const body = await readJson(request);

  return {
    ...queryInput,
    ...(body || {})
  };
}

async function readOptionalSession(request, env) {
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

function normalizeObject(input) {
  const object = input && typeof input === "object" ? input : {};

  return {
    id: cleanText(
      object.id ||
      object.object_id ||
      object.objectId
    ),
    handle: cleanHandle(
      object.handle ||
      object.object_handle ||
      object.objectHandle
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
    url: cleanText(object.url || object.href) || null,
    image_url: cleanText(
      object.image_url ||
      object.imageUrl ||
      object.photo_url ||
      object.photoUrl
    ) || null,
    price: object.price || null,
    metadata: cleanMetadata(object.metadata)
  };
}

function detectSource(request) {
  const url = new URL(request.url);

  if (url.searchParams.get("qr") === "1") return "qr";
  if (url.searchParams.get("nfc") === "1") return "nfc";
  if (url.searchParams.get("photo") === "1") return "photo";
  if (url.searchParams.get("receipt") === "1") return "receipt";

  return "object_link";
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
