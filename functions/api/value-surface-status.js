/**
 * functions/api/value-surface-status.js
 *
 * CyberCrowd Value Surface Status
 *
 * ONE JOB:
 * Change the status of one registered value surface.
 *
 * This is NOT value-surface.js.
 * This is NOT value-snapshot.js.
 * This is NOT value-low-water.js.
 * This is NOT value-topup.js.
 * This is NOT value-topup-decision.js.
 * This is NOT value-balance.js.
 * This does NOT register surfaces.
 * This does NOT request topups.
 * This does NOT approve topups.
 * This does NOT move balances.
 * This does NOT process payments.
 * This does NOT charge cards.
 * This does NOT expose real accounts.
 * This does NOT create a PING.
 *
 * Value Surface Status says:
 * this existing surface is active, paused, locked, or archived.
 */

const SURFACE_TTL_SECONDS = 60 * 60 * 24 * 365;
const INDEX_TTL_SECONDS = 60 * 60 * 24 * 365;
const MAX_INDEX_ITEMS = 100;

const ALLOWED_STATUS = new Set([
  "active",
  "paused",
  "locked",
  "archived"
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
      body.value_surface_id ||
      body.valueSurfaceId ||
      body.id
  );

  if (!surfaceId) {
    return json({ ok: false, error: "VALUE_SURFACE_ID_REQUIRED" }, 400);
  }

  const nextStatus = cleanText(body.status || body.next_status || body.nextStatus).toLowerCase();

  if (!ALLOWED_STATUS.has(nextStatus)) {
    return json(
      {
        ok: false,
        error: "VALUE_SURFACE_STATUS_NOT_ALLOWED",
        allowed: Array.from(ALLOWED_STATUS)
      },
      400
    );
  }

  const surface = await readValueSurface(env, surfaceId);

  if (!surface) {
    return json({ ok: false, error: "VALUE_SURFACE_NOT_FOUND" }, 404);
  }

  if (cleanText(surface.identity_id || surface.identityId) !== identityId) {
    return json({ ok: false, error: "VALUE_SURFACE_ACCESS_DENIED" }, 403);
  }

  const previousStatus = cleanText(surface.status || "active").toLowerCase();
  const now = new Date().toISOString();

  const updatedSurface = {
    ...surface,
    id: cleanText(surface.id || surface.surface_id || surface.surfaceId || surfaceId),
    status: nextStatus,
    status_updated_at: now,
    updated_at: now
  };

  await env.IDENTITY.put("value-surface:" + updatedSurface.id, JSON.stringify(updatedSurface), {
    expirationTtl: SURFACE_TTL_SECONDS
  });

  await appendIndex(env, "value-surface:index:status:" + nextStatus, updatedSurface.id);

  await appendSync(env, identityId, {
    type: "identity_value_surface_status_changed",
    value_surface_id: updatedSurface.id,
    previous_status: previousStatus,
    status: nextStatus,
    at: now
  });

  await appendSync(env, updatedSurface.id, {
    type: "value_surface_status_changed",
    value_surface_id: updatedSurface.id,
    identity_id: identityId,
    previous_status: previousStatus,
    status: nextStatus,
    at: now
  });

  return json({
    ok: true,
    updated: true,
    identity_id: identityId,
    value_surface_id: updatedSurface.id,
    previous_status: previousStatus,
    status: nextStatus,
    topup_requested: false,
    decision_created: false,
    balance_moved: false,
    payment_created: false,
    checkout_created: false,
    bank_transfer_executed: false,
    card_charged: false,
    real_account_exposed: false,
    ping_created: false
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

async function readValueSurface(env, surfaceId) {
  const id = cleanText(surfaceId);

  if (!id) return null;

  return readJsonKey(env, "value-surface:" + id);
}

async function appendIndex(env, key, value) {
  if (!key || !value) return;

  const raw = await env.IDENTITY.get(key);
  let list = [];

  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) list = parsed;
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
      if (Array.isArray(parsed)) trail = parsed;
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
