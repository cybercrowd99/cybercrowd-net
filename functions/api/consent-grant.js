/**
 * functions/api/consent-grant.js
 *
 * CyberCrowd Consent Grant
 *
 * ONE JOB:
 * Record that one identity requested limited consent for another identity.
 *
 * This is NOT consent-decision.js.
 * This is NOT consent-revoke.js.
 * This is NOT consent-scope.js.
 * This is NOT login.
 * This is NOT identity collapse.
 * This does NOT approve consent.
 * This does NOT activate authority.
 * This does NOT move money.
 * This does NOT expose secrets.
 * This does NOT create a PING.
 *
 * consent-grant.js says:
 * this identity asked to grant limited permission to another identity.
 *
 * Next worker:
 * consent-decision.js approves or blocks the grant.
 */

const CONSENT_TTL_SECONDS = 60 * 60 * 24 * 365;
const INDEX_TTL_SECONDS = 60 * 60 * 24 * 365;
const MAX_INDEX_ITEMS = 100;

const ALLOWED_STATUS = new Set([
  "requested",
  "cancelled"
]);

const ALLOWED_SCOPE = new Set([
  "view_profile",
  "view_resume",
  "view_surface",
  "view_value",
  "request_value",
  "message",
  "handoff",
  "proof",
  "presence",
  "other"
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

  const ownerIdentityId = getIdentityIdFromSession(session);

  if (!ownerIdentityId) {
    return json({ ok: false, error: "SESSION_IDENTITY_MISSING" }, 401);
  }

  const body = await readRequestJson(request);

  if (!body) {
    return json({ ok: false, error: "JSON_REQUIRED" }, 400);
  }

  const granteeIdentityId = cleanText(
    firstDefined(
      body.grantee_identity_id,
      body.granteeIdentityId,
      body.to_identity_id,
      body.toIdentityId,
      body.target_identity_id,
      body.targetIdentityId
    )
  );

  if (!granteeIdentityId) {
    return json({ ok: false, error: "GRANTEE_IDENTITY_REQUIRED" }, 400);
  }

  if (granteeIdentityId === ownerIdentityId) {
    return json({ ok: false, error: "CONSENT_SELF_GRANT_NOT_ALLOWED" }, 409);
  }

  const scopes = normalizeScopes(
    firstDefined(
      body.scopes,
      body.scope,
      body.permissions,
      body.permission
    )
  );

  if (!scopes.length) {
    return json({ ok: false, error: "CONSENT_SCOPE_REQUIRED" }, 400);
  }

  const status = normalizeStatus(firstDefined(body.status, "requested"));

  if (!status) {
    return json(
      {
        ok: false,
        error: "CONSENT_GRANT_STATUS_NOT_ALLOWED",
        allowed: Array.from(ALLOWED_STATUS)
      },
      400
    );
  }

  const now = new Date().toISOString();

  const consentId =
    cleanText(
      firstDefined(
        body.consent_id,
        body.consentId,
        body.consent_grant_id,
        body.consentGrantId
      )
    ) || makeId("CONSENT_GRANT");

  const expiresAt = cleanText(
    firstDefined(
      body.expires_at,
      body.expiresAt,
      body.expiration,
      ""
    )
  ) || null;

  const consent = {
    id: consentId,
    consent_id: consentId,
    consent_grant_id: consentId,

    owner_identity_id: ownerIdentityId,
    actor_identity_id: ownerIdentityId,
    grantee_identity_id: granteeIdentityId,

    scopes,

    status,
    requested: true,
    decided: false,
    approved: false,
    blocked: false,
    active: false,
    revoked: false,

    expires_at: expiresAt,

    consent_active: false,
    authority_active: false,
    money_moved: false,
    secret_exposed: false,
    identity_collapsed: false,
    records_erased: false,
    ping_created: false,

    reason: cleanText(body.reason || "manual") || "manual",
    note: cleanText(body.note || body.description || "") || null,

    created_at: now,
    updated_at: now,

    metadata: cleanMetadata(body.metadata)
  };

  await env.IDENTITY.put("consent-grant:" + consent.id, JSON.stringify(consent), {
    expirationTtl: CONSENT_TTL_SECONDS
  });

  await appendIndex(env, "consent-grant:index:owner:" + ownerIdentityId, consent.id);
  await appendIndex(env, "consent-grant:index:grantee:" + granteeIdentityId, consent.id);
  await appendIndex(env, "consent-grant:index:status:" + status, consent.id);

  for (const scope of scopes) {
    await appendIndex(env, "consent-grant:index:scope:" + scope, consent.id);
  }

  await appendSync(env, ownerIdentityId, {
    type: "consent_grant_requested",
    consent_grant_id: consent.id,
    grantee_identity_id: granteeIdentityId,
    scopes,
    status,
    active: false,
    revoked: false,
    at: now
  });

  await appendSync(env, granteeIdentityId, {
    type: "consent_grant_received",
    consent_grant_id: consent.id,
    owner_identity_id: ownerIdentityId,
    scopes,
    status,
    active: false,
    revoked: false,
    at: now
  });

  return json({
    ok: true,
    created: true,
    consent_grant_id: consent.id,
    consent_id: consent.id,
    owner_identity_id: ownerIdentityId,
    grantee_identity_id: granteeIdentityId,
    scopes,
    status,
    requested: true,
    decided: false,
    approved: false,
    blocked: false,
    active: false,
    revoked: false,
    consent_active: false,
    authority_active: false,
    money_moved: false,
    secret_exposed: false,
    identity_collapsed: false,
    records_erased: false,
    ping_created: false,
    next: {
      route: "/api/consent-decision",
      method: "POST",
      reason: "consent_grant_requested"
    }
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

  const url = new URL(request.url);

  const consentId = cleanText(
    url.searchParams.get("consent_id") ||
      url.searchParams.get("consentId") ||
      url.searchParams.get("consent_grant_id") ||
      url.searchParams.get("consentGrantId") ||
      url.searchParams.get("id")
  );

  if (consentId) {
    const consent = await readConsent(env, consentId);

    if (!consent) {
      return json({ ok: false, error: "CONSENT_GRANT_NOT_FOUND" }, 404);
    }

    if (
      cleanText(consent.owner_identity_id || consent.ownerIdentityId) !== identityId &&
      cleanText(consent.grantee_identity_id || consent.granteeIdentityId) !== identityId
    ) {
      return json({ ok: false, error: "CONSENT_GRANT_ACCESS_DENIED" }, 403);
    }

    return json({
      ok: true,
      consent_grant: cleanConsentForReturn(consent)
    });
  }

  const role = cleanText(url.searchParams.get("role") || "owner").toLowerCase();
  const key = role === "grantee"
    ? "consent-grant:index:grantee:" + identityId
    : "consent-grant:index:owner:" + identityId;

  const ids = await readIndex(env, key);
  const grants = [];

  for (const id of ids) {
    const consent = await readConsent(env, id);

    if (!consent) continue;

    const ownerId = cleanText(consent.owner_identity_id || consent.ownerIdentityId);
    const granteeId = cleanText(consent.grantee_identity_id || consent.granteeIdentityId);

    if (ownerId !== identityId && granteeId !== identityId) continue;

    grants.push(cleanConsentForReturn(consent));
  }

  return json({
    ok: true,
    identity_id: identityId,
    role,
    count: grants.length,
    consent_grants: grants,
    consent_active: false,
    authority_active: false,
    money_moved: false,
    secret_exposed: false,
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

async function readConsent(env, consentId) {
  const id = cleanText(consentId);

  if (!id) return null;

  return readJsonKey(env, "consent-grant:" + id);
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

function cleanConsentForReturn(consent) {
  return {
    id: consent.id,
    consent_id: consent.consent_id || consent.id,
    consent_grant_id: consent.consent_grant_id || consent.id,
    owner_identity_id: consent.owner_identity_id,
    grantee_identity_id: consent.grantee_identity_id,
    scopes: Array.isArray(consent.scopes) ? consent.scopes : [],
    status: consent.status || "requested",
    requested: consent.requested === true,
    decided: consent.decided === true,
    approved: consent.approved === true,
    blocked: consent.blocked === true,
    active: consent.active === true,
    revoked: consent.revoked === true,
    expires_at: consent.expires_at || null,
    consent_active: consent.consent_active === true,
    authority_active: consent.authority_active === true,
    money_moved: false,
    secret_exposed: false,
    identity_collapsed: false,
    records_erased: false,
    ping_created: false,
    reason: consent.reason || "manual",
    note: consent.note || null,
    created_at: consent.created_at || null,
    updated_at: consent.updated_at || null
  };
}

function normalizeScopes(value) {
  const list = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",")
      : [];

  const clean = [];

  for (const item of list) {
    const scope = cleanText(item).toLowerCase();

    if (!scope) continue;

    if (ALLOWED_SCOPE.has(scope)) {
      clean.push(scope);
    } else {
      clean.push("other");
    }
  }

  return Array.from(new Set(clean)).slice(0, 25);
}

function normalizeStatus(value) {
  const clean = cleanText(value || "requested").toLowerCase();

  if (ALLOWED_STATUS.has(clean)) {
    return clean;
  }

  return "";
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

function firstDefined(...values) {
  for (const value of values) {
    if (value !== undefined) {
      return value;
    }
  }

  return undefined;
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
