/**
 * functions/api/value-surface.js
 *
 * CyberCrowd Value Surface
 *
 * ONE JOB:
 * Register cards/accounts under one identity without exposing real account secrets.
 *
 * This is NOT payment processing.
 * This is NOT checkout.
 * This is NOT banking custody.
 * This does NOT store full card numbers.
 * This does NOT store bank login credentials.
 * This does NOT create a PING.
 *
 * Identity says:
 * one verified human boundary.
 *
 * Value Surface says:
 * this identity has separate money surfaces underneath:
 * business card, savings, spouse savings, play card,
 * cash pocket, spend buffer, or other controlled surface.
 *
 * Rule:
 * Real accounts stay shielded.
 * Street-facing play money can move.
 */

const SURFACE_TTL_SECONDS = 60 * 60 * 24 * 365;
const INDEX_TTL_SECONDS = 60 * 60 * 24 * 365;
const MAX_INDEX_ITEMS = 100;

const ALLOWED_SURFACE_KIND = new Set([
  "business_card",
  "personal_card",
  "savings",
  "spouse_savings",
  "play_card",
  "cash_pocket",
  "spend_buffer",
  "ledger",
  "other"
]);

const ALLOWED_ROLE = new Set([
  "source",
  "buffer",
  "street",
  "reserve",
  "business",
  "household",
  "other"
]);

const ALLOWED_STATUS = new Set([
  "active",
  "paused",
  "locked",
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

  const kind = normalizeSurfaceKind(
    body.kind ||
    body.surface_kind ||
    body.surfaceKind ||
    "other"
  );

  if (!ALLOWED_SURFACE_KIND.has(kind)) {
    return json({
      ok: false,
      error: "VALUE_SURFACE_KIND_NOT_ALLOWED",
      allowed: Array.from(ALLOWED_SURFACE_KIND)
    }, 400);
  }

  const role = normalizeRole(
    body.role ||
    body.surface_role ||
    body.surfaceRole ||
    defaultRoleForKind(kind)
  );

  if (!ALLOWED_ROLE.has(role)) {
    return json({
      ok: false,
      error: "VALUE_SURFACE_ROLE_NOT_ALLOWED",
      allowed: Array.from(ALLOWED_ROLE)
    }, 400);
  }

  const status = cleanText(body.status || "active").toLowerCase();

  if (!ALLOWED_STATUS.has(status)) {
    return json({
      ok: false,
      error: "VALUE_SURFACE_STATUS_NOT_ALLOWED",
      allowed: Array.from(ALLOWED_STATUS)
    }, 400);
  }

  const now = new Date().toISOString();

  const surfaceId = cleanText(
    body.surface_id ||
    body.surfaceId ||
    body.id
  ) || makeId("VALUE_SURFACE");

  const label = cleanText(
    body.label ||
    body.name ||
    defaultLabelForKind(kind)
  );

  const last4 = cleanLast4(body.last4 || body.last_four || body.lastFour);
  const provider = cleanText(body.provider || body.bank || body.issuer) || null;

  const balanceCents = normalizeCents(body.balance_cents || body.balanceCents || body.balance);
  const lowWaterCents = normalizeCents(body.low_water_cents || body.lowWaterCents || body.low_water || 1000);
  const topupDefaultCents = normalizeCents(body.topup_default_cents || body.topupDefaultCents || body.topup_default || 2000);

  const surface = {
    id: surfaceId,
    identity_id: identityId,

    kind,
    role,
    status,

    label,
    provider,
    last4,

    currency: cleanText(body.currency || "USD").toUpperCase(),

    balance_cents: balanceCents,
    low_water_cents: lowWaterCents,
    topup_default_cents: topupDefaultCents,

    street_exposed: role === "street" || kind === "play_card" || kind === "cash_pocket",
    real_account_exposed: false,

    source_allowed: role === "source" || role === "reserve" || role === "business" || role === "household",
    spend_allowed: role === "street" || role === "buffer" || kind === "play_card" || kind === "cash_pocket",

    note: cleanText(body.note || body.description) || null,

    created_at: now,
    updated_at: now,

    metadata: cleanMetadata(body.metadata)
  };

  await env.IDENTITY.put(
    "value-surface:" + surface.id,
    JSON.stringify(surface),
    {
      expirationTtl: SURFACE_TTL_SECONDS
    }
  );

  await appendIndex(env, "value-surface:index:identity:" + identityId, surface.id);
  await appendIndex(env, "value-surface:index:kind:" + kind, surface.id);
  await appendIndex(env, "value-surface:index:role:" + role, surface.id);
  await appendIndex(env, "value-surface:index:status:" + status, surface.id);

  if (surface.street_exposed) {
    await appendIndex(env, "value-surface:index:street:" + identityId, surface.id);
  }

  if (surface.source_allowed) {
    await appendIndex(env, "value-surface:index:source:" + identityId, surface.id);
  }

  await appendSync(env, identityId, {
    type: "identity_value_surface_registered",
    value_surface_id: surface.id,
    kind: surface.kind,
    role: surface.role,
    status: surface.status,
    street_exposed: surface.street_exposed,
    real_account_exposed: false,
    at: now
  });

  await appendSync(env, surface.id, {
    type: "value_surface_created",
    value_surface_id: surface.id,
    identity_id: identityId,
    kind: surface.kind,
    role: surface.role,
    status: surface.status,
    at: now
  });

  return json({
    ok: true,
    created: true,
    value_surface_id: surface.id,
    identity_id: identityId,
    kind: surface.kind,
    role: surface.role,
    status: surface.status,
    label: surface.label,
    provider: surface.provider,
    last4: surface.last4,
    currency: surface.currency,
    balance_cents: surface.balance_cents,
    low_water_cents: surface.low_water_cents,
    topup_default_cents: surface.topup_default_cents,
    street_exposed: surface.street_exposed,
    real_account_exposed: false,
    ping_created: false,
    payment_created: false,
    checkout_created: false,
    next: {
      route: "/api/value-topup",
      method: "POST",
      reason: "surface_registered"
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
        error: "VALUE_SURFACE_NOT_FOUND"
      }, 404);
    }

    if (surface.identity_id !== identityId) {
      return json({
        ok: false,
        error: "VALUE_SURFACE_ACCESS_DENIED"
      }, 403);
    }

    return json({
      ok: true,
      value_surface: cleanSurfaceForReturn(surface),
      ping_created: false,
      payment_created: false
    });
  }

  const ids = await readIndex(env, "value-surface:index:identity:" + identityId);
  const surfaces = [];

  for (const id of ids) {
    const surface = await readSurface(env, id);

    if (!surface) continue;
    if (surface.identity_id !== identityId) continue;

    surfaces.push(cleanSurfaceForReturn(surface));
  }

  return json({
    ok: true,
    identity_id: identityId,
    count: surfaces.length,
    value_surfaces: surfaces,
    ping_created: false,
    payment_created: false
  });
}

export async function onRequestPatch(context) {
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
      error: "VALUE_SURFACE_ID_REQUIRED"
    }, 400);
  }

  const existing = await readSurface(env, surfaceId);

  if (!existing) {
    return json({
      ok: false,
      error: "VALUE_SURFACE_NOT_FOUND"
    }, 404);
  }

  if (existing.identity_id !== identityId) {
    return json({
      ok: false,
      error: "VALUE_SURFACE_ACCESS_DENIED"
    }, 403);
  }

  const nextStatus = body.status
    ? cleanText(body.status).toLowerCase()
    : existing.status;

  if (!ALLOWED_STATUS.has(nextStatus)) {
    return json({
      ok: false,
      error: "VALUE_SURFACE_STATUS_NOT_ALLOWED",
      allowed: Array.from(ALLOWED_STATUS)
    }, 400);
  }

  const now = new Date().toISOString();

  const updated = {
    ...existing,
    label: cleanText(body.label || body.name) || existing.label,
    provider: cleanText(body.provider || body.bank || body.issuer) || existing.provider || null,
    last4: cleanLast4(body.last4 || body.last_four || body.lastFour) || existing.last4 || null,
    status: nextStatus,
    balance_cents: body.balance_cents !== undefined || body.balanceCents !== undefined || body.balance !== undefined
      ? normalizeCents(body.balance_cents || body.balanceCents || body.balance)
      : existing.balance_cents,
    low_water_cents: body.low_water_cents !== undefined || body.lowWaterCents !== undefined || body.low_water !== undefined
      ? normalizeCents(body.low_water_cents || body.lowWaterCents || body.low_water)
      : existing.low_water_cents,
    topup_default_cents: body.topup_default_cents !== undefined || body.topupDefaultCents !== undefined || body.topup_default !== undefined
      ? normalizeCents(body.topup_default_cents || body.topupDefaultCents || body.topup_default)
      : existing.topup_default_cents,
    note: cleanText(body.note || body.description) || existing.note || null,
    updated_at: now
  };

  await env.IDENTITY.put(
    "value-surface:" + updated.id,
    JSON.stringify(updated),
    {
      expirationTtl: SURFACE_TTL_SECONDS
    }
  );

  await appendIndex(env, "value-surface:index:status:" + updated.status, updated.id);

  await appendSync(env, identityId, {
    type: "identity_value_surface_updated",
    value_surface_id: updated.id,
    status: updated.status,
    balance_cents: updated.balance_cents,
    real_account_exposed: false,
    at: now
  });

  await appendSync(env, updated.id, {
    type: "value_surface_updated",
    value_surface_id: updated.id,
    identity_id: identityId,
    status: updated.status,
    at: now
  });

  return json({
    ok: true,
    updated: true,
    value_surface: cleanSurfaceForReturn(updated),
    ping_created: false,
    payment_created: false
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

  if (!id) return null;

  const raw = await env.IDENTITY.get("value-surface:" + id);

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function readIndex(env, key) {
  const raw = await env.IDENTITY.get(key);

  if (!raw) return [];

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
    kind: surface.kind,
    role: surface.role,
    status: surface.status,
    label: surface.label || null,
    provider: surface.provider || null,
    last4: surface.last4 || null,
    currency: surface.currency || "USD",
    balance_cents: Number(surface.balance_cents || 0),
    low_water_cents: Number(surface.low_water_cents || 0),
    topup_default_cents: Number(surface.topup_default_cents || 0),
    street_exposed: surface.street_exposed === true,
    real_account_exposed: false,
    source_allowed: surface.source_allowed === true,
    spend_allowed: surface.spend_allowed === true,
    note: surface.note || null,
    created_at: surface.created_at || null,
    updated_at: surface.updated_at || null
  };
}

function normalizeSurfaceKind(value) {
  const clean = cleanText(value).toLowerCase();

  if (!clean) return "other";

  if (clean === "business") return "business_card";
  if (clean === "biz_card") return "business_card";
  if (clean === "card") return "personal_card";
  if (clean === "personal") return "personal_card";
  if (clean === "wife_savings") return "spouse_savings";
  if (clean === "spouse") return "spouse_savings";
  if (clean === "play") return "play_card";
  if (clean === "walking_money") return "play_card";
  if (clean === "street_card") return "play_card";
  if (clean === "cash") return "cash_pocket";
  if (clean === "buffer") return "spend_buffer";

  return clean;
}

function normalizeRole(value) {
  const clean = cleanText(value).toLowerCase();

  if (!clean) return "other";

  if (clean === "funding") return "source";
  if (clean === "funding_source") return "source";
  if (clean === "walking") return "street";
  if (clean === "walking_money") return "street";
  if (clean === "play") return "street";
  if (clean === "safe") return "reserve";
  if (clean === "home") return "household";

  return clean;
}

function defaultRoleForKind(kind) {
  if (kind === "business_card") return "business";
  if (kind === "savings") return "reserve";
  if (kind === "spouse_savings") return "household";
  if (kind === "play_card") return "street";
  if (kind === "cash_pocket") return "street";
  if (kind === "spend_buffer") return "buffer";
  return "other";
}

function defaultLabelForKind(kind) {
  if (kind === "business_card") return "Business card";
  if (kind === "personal_card") return "Personal card";
  if (kind === "savings") return "Savings";
  if (kind === "spouse_savings") return "Spouse savings";
  if (kind === "play_card") return "Play money card";
  if (kind === "cash_pocket") return "Cash pocket";
  if (kind === "spend_buffer") return "Spend buffer";
  if (kind === "ledger") return "Ledger";
  return "Value surface";
}

function normalizeCents(value) {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    if (Math.abs(value) < 1000 && !Number.isInteger(value)) {
      return Math.round(value * 100);
    }

    return Math.round(value);
  }

  const clean = String(value).replace(/[$,\s]/g, "");
  const number = Number(clean);

  if (!Number.isFinite(number)) {
    return 0;
  }

  if (clean.includes(".")) {
    return Math.round(number * 100);
  }

  return Math.round(number);
}

function cleanLast4(value) {
  const clean = String(value || "").replace(/\D/g, "");

  if (!clean) return null;

  return clean.slice(-4);
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
      lower.includes("cookie") ||
      lower.includes("card") ||
      lower.includes("account") ||
      lower.includes("routing")
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
