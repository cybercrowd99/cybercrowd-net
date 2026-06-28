/**
 * functions/api/identity-turnstile.js
 *
 * CyberCrowd Identity Turnstile
 *
 * ONE JOB:
 * Record the human collapse gate before an identity can be deleted.
 *
 * This is NOT account deletion.
 * This is NOT identity collapse.
 * This is NOT payment processing.
 * This is NOT KC custody.
 * This is NOT session creation.
 * This does NOT delete identity records.
 * This does NOT erase history.
 * This does NOT move money.
 * This does NOT charge cards.
 * This does NOT create a PING.
 *
 * identity-turnstile.js says:
 * this human passed or failed the irreversible collapse gate.
 *
 * Next worker:
 * identity-collapse-decision.js approves or blocks the actual collapse request.
 */

const TURNSTILE_TTL_SECONDS = 60 * 60 * 24 * 365;
const INDEX_TTL_SECONDS = 60 * 60 * 24 * 365;
const MAX_INDEX_ITEMS = 100;

const REQUIRED_CONFIRMATION = "I understand this is irreversible";

const ALLOWED_STATUS = new Set([
  "passed",
  "failed"
]);

const ALLOWED_REASON = new Set([
  "human_confirmed",
  "missing_required_fields",
  "confirmation_phrase_invalid",
  "deterrence_not_satisfied",
  "moment_code_invalid",
  "kc_reference_missing",
  "session_identity_mismatch",
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

  const sessionIdentityId = getIdentityIdFromSession(session);

  if (!sessionIdentityId) {
    return json({ ok: false, error: "SESSION_IDENTITY_MISSING" }, 401);
  }

  const body = await readRequestJson(request);

  if (!body) {
    return json({ ok: false, error: "JSON_REQUIRED" }, 400);
  }

  const targetIdentityId = cleanText(
    firstDefined(
      body.identity_id,
      body.identityId,
      body.id,
      body.target_identity_id,
      body.targetIdentityId
    )
  );

  const confirmation = cleanText(
    firstDefined(
      body.confirm,
      body.confirmation,
      body.confirmation_phrase,
      body.confirmationPhrase
    )
  );

  const momentCode = cleanText(
    firstDefined(
      body.moment_code,
      body.momentCode,
      body.human_code,
      body.humanCode
    )
  );

  const deterrencePaid = normalizeBoolean(
    firstDefined(
      body.deterrence_paid,
      body.deterrencePaid,
      body.deterrence_satisfied,
      body.deterrenceSatisfied
    )
  );

  const deterrenceReference = cleanText(
    firstDefined(
      body.deterrence_reference,
      body.deterrenceReference,
      body.payment_reference,
      body.paymentReference,
      body.receipt_reference,
      body.receiptReference
    )
  );

  const kcBlock = normalizeKcBlock(
    firstDefined(
      body.kc,
      body.kc_block,
      body.kcBlock,
      body.kc_reference,
      body.kcReference
    )
  );

  const gate = evaluateGate({
    sessionIdentityId,
    targetIdentityId,
    confirmation,
    deterrencePaid,
    deterrenceReference,
    momentCode,
    kcBlock
  });

  const now = new Date().toISOString();
  const turnstileId =
    cleanText(
      firstDefined(
        body.identity_turnstile_id,
        body.identityTurnstileId,
        body.turnstile_id,
        body.turnstileId
      )
    ) || makeId("IDENTITY_TURNSTILE");

  const status = gate.ok ? "passed" : "failed";
  const reason = normalizeReason(gate.reason);

  const record = {
    id: turnstileId,
    identity_turnstile_id: turnstileId,

    identity_id: targetIdentityId || sessionIdentityId,
    actor_identity_id: sessionIdentityId,

    status,
    reason,

    gate_passed: gate.ok === true,
    gate_failed: gate.ok !== true,

    confirmation_phrase_required: REQUIRED_CONFIRMATION,
    confirmation_phrase_matched: confirmation === REQUIRED_CONFIRMATION,

    deterrence_satisfied: deterrencePaid === true,
    deterrence_reference: deterrenceReference || null,

    moment_code_present: !!momentCode,
    moment_code_valid: isValidMomentCode(momentCode),

    kc_ref: kcBlock.kc_ref || null,
    kc_metal: kcBlock.kc_metal || "none",
    kc_value: kcBlock.kc_value || 0,
    kc_present: !!kcBlock.kc_ref,

    collapse_requested: false,
    collapse_decided: false,
    identity_deleted: false,
    identity_collapsed: false,
    records_erased: false,
    payment_created: false,
    checkout_created: false,
    bank_transfer_executed: false,
    card_charged: false,
    real_account_exposed: false,
    ping_created: false,

    error: gate.error || null,
    note: cleanText(body.note || body.description || "") || null,

    created_at: now,
    updated_at: now,

    metadata: cleanMetadata(body.metadata)
  };

  await env.IDENTITY.put("identity-turnstile:" + record.id, JSON.stringify(record), {
    expirationTtl: TURNSTILE_TTL_SECONDS
  });

  await appendIndex(env, "identity-turnstile:index:identity:" + record.identity_id, record.id);
  await appendIndex(env, "identity-turnstile:index:actor:" + sessionIdentityId, record.id);
  await appendIndex(env, "identity-turnstile:index:status:" + status, record.id);
  await appendIndex(env, "identity-turnstile:index:reason:" + reason, record.id);

  await appendSync(env, record.identity_id, {
    type: "identity_turnstile_recorded",
    identity_turnstile_id: record.id,
    actor_identity_id: sessionIdentityId,
    status,
    reason,
    gate_passed: record.gate_passed,
    collapse_requested: false,
    identity_deleted: false,
    records_erased: false,
    at: now
  });

  await appendSync(env, sessionIdentityId, {
    type: "actor_identity_turnstile_recorded",
    identity_turnstile_id: record.id,
    target_identity_id: record.identity_id,
    status,
    reason,
    gate_passed: record.gate_passed,
    collapse_requested: false,
    identity_deleted: false,
    at: now
  });

  return json({
    ok: true,
    created: true,
    identity_turnstile_id: record.id,
    identity_id: record.identity_id,
    actor_identity_id: sessionIdentityId,
    status,
    reason,
    gate_passed: record.gate_passed,
    gate_failed: record.gate_failed,
    confirmation_phrase_matched: record.confirmation_phrase_matched,
    deterrence_satisfied: record.deterrence_satisfied,
    moment_code_valid: record.moment_code_valid,
    kc_present: record.kc_present,
    collapse_requested: false,
    collapse_decided: false,
    identity_deleted: false,
    identity_collapsed: false,
    records_erased: false,
    payment_created: false,
    checkout_created: false,
    bank_transfer_executed: false,
    card_charged: false,
    real_account_exposed: false,
    ping_created: false,
    next: record.gate_passed
      ? {
          route: "/api/identity-collapse-decision",
          method: "POST",
          reason: "identity_turnstile_passed"
        }
      : null
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

  const sessionIdentityId = getIdentityIdFromSession(session);

  if (!sessionIdentityId) {
    return json({ ok: false, error: "SESSION_IDENTITY_MISSING" }, 401);
  }

  const url = new URL(request.url);

  const turnstileId = cleanText(
    url.searchParams.get("identity_turnstile_id") ||
      url.searchParams.get("identityTurnstileId") ||
      url.searchParams.get("turnstile_id") ||
      url.searchParams.get("turnstileId") ||
      url.searchParams.get("id")
  );

  if (turnstileId) {
    const record = await readTurnstile(env, turnstileId);

    if (!record) {
      return json({ ok: false, error: "IDENTITY_TURNSTILE_NOT_FOUND" }, 404);
    }

    if (
      cleanText(record.identity_id || record.identityId) !== sessionIdentityId &&
      cleanText(record.actor_identity_id || record.actorIdentityId) !== sessionIdentityId
    ) {
      return json({ ok: false, error: "IDENTITY_TURNSTILE_ACCESS_DENIED" }, 403);
    }

    return json({
      ok: true,
      identity_turnstile: cleanTurnstileForReturn(record)
    });
  }

  const targetIdentityId = cleanText(
    url.searchParams.get("identity_id") ||
      url.searchParams.get("identityId") ||
      url.searchParams.get("target_identity_id") ||
      url.searchParams.get("targetIdentityId")
  );

  const key = targetIdentityId
    ? "identity-turnstile:index:identity:" + targetIdentityId
    : "identity-turnstile:index:actor:" + sessionIdentityId;

  const ids = await readIndex(env, key);
  const records = [];

  for (const id of ids) {
    const record = await readTurnstile(env, id);

    if (!record) continue;

    const recordIdentityId = cleanText(record.identity_id || record.identityId);
    const actorIdentityId = cleanText(record.actor_identity_id || record.actorIdentityId);

    if (recordIdentityId !== sessionIdentityId && actorIdentityId !== sessionIdentityId) continue;

    records.push(cleanTurnstileForReturn(record));
  }

  return json({
    ok: true,
    identity_id: sessionIdentityId,
    count: records.length,
    identity_turnstiles: records,
    identity_deleted: false,
    records_erased: false,
    ping_created: false
  });
}

function evaluateGate(input) {
  if (
    !input.sessionIdentityId ||
    !input.targetIdentityId ||
    !input.confirmation ||
    !input.momentCode
  ) {
    return {
      ok: false,
      error: "MISSING_REQUIRED_FIELDS",
      reason: "missing_required_fields"
    };
  }

  if (input.sessionIdentityId !== input.targetIdentityId) {
    return {
      ok: false,
      error: "SESSION_IDENTITY_MISMATCH",
      reason: "session_identity_mismatch"
    };
  }

  if (input.confirmation !== REQUIRED_CONFIRMATION) {
    return {
      ok: false,
      error: "CONFIRMATION_PHRASE_INVALID",
      reason: "confirmation_phrase_invalid"
    };
  }

  if (input.deterrencePaid !== true && !input.deterrenceReference) {
    return {
      ok: false,
      error: "DETERRENCE_NOT_SATISFIED",
      reason: "deterrence_not_satisfied"
    };
  }

  if (!input.kcBlock || !input.kcBlock.kc_ref) {
    return {
      ok: false,
      error: "KC_REFERENCE_MISSING",
      reason: "kc_reference_missing"
    };
  }

  if (!isValidMomentCode(input.momentCode)) {
    return {
      ok: false,
      error: "MOMENT_CODE_INVALID",
      reason: "moment_code_invalid"
    };
  }

  return {
    ok: true,
    reason: "human_confirmed"
  };
}

function normalizeKcBlock(value) {
  if (!value) {
    return {
      kc_ref: "",
      kc_metal: "none",
      kc_value: 0
    };
  }

  if (typeof value === "string" || typeof value === "number") {
    return {
      kc_ref: cleanText(value),
      kc_metal: "none",
      kc_value: 0
    };
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    return {
      kc_ref: cleanText(value.kc_ref || value.kcRef || value.ref || value.id || ""),
      kc_metal: cleanText(value.kc_metal || value.kcMetal || value.metal || "none") || "none",
      kc_value: Number(value.kc_value || value.kcValue || value.value || 0)
    };
  }

  return {
    kc_ref: "",
    kc_metal: "none",
    kc_value: 0
  };
}

function isValidMomentCode(value) {
  const clean = cleanText(value);

  if (clean.length < 6) return false;
  if (clean.length > 64) return false;

  return /^[A-Za-z0-9._-]+$/.test(clean);
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

async function readTurnstile(env, turnstileId) {
  const id = cleanText(turnstileId);

  if (!id) return null;

  return readJsonKey(env, "identity-turnstile:" + id);
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

function cleanTurnstileForReturn(record) {
  return {
    id: record.id,
    identity_turnstile_id: record.identity_turnstile_id || record.id,
    identity_id: record.identity_id,
    actor_identity_id: record.actor_identity_id,
    status: record.status,
    reason: record.reason,
    gate_passed: record.gate_passed === true,
    gate_failed: record.gate_failed === true,
    confirmation_phrase_matched: record.confirmation_phrase_matched === true,
    deterrence_satisfied: record.deterrence_satisfied === true,
    deterrence_reference: record.deterrence_reference || null,
    moment_code_present: record.moment_code_present === true,
    moment_code_valid: record.moment_code_valid === true,
    kc_ref: record.kc_ref || null,
    kc_metal: record.kc_metal || "none",
    kc_value: Number(record.kc_value || 0),
    kc_present: record.kc_present === true,
    collapse_requested: false,
    collapse_decided: false,
    identity_deleted: false,
    identity_collapsed: false,
    records_erased: false,
    payment_created: false,
    checkout_created: false,
    bank_transfer_executed: false,
    card_charged: false,
    real_account_exposed: false,
    ping_created: false,
    error: record.error || null,
    note: record.note || null,
    created_at: record.created_at || null,
    updated_at: record.updated_at || null
  };
}

function normalizeBoolean(value) {
  if (value === true) return true;
  if (value === false) return false;

  const clean = cleanText(value).toLowerCase();

  if (clean === "true") return true;
  if (clean === "yes") return true;
  if (clean === "1") return true;
  if (clean === "paid") return true;
  if (clean === "satisfied") return true;

  return false;
}

function normalizeReason(value) {
  const clean = cleanText(value || "other").toLowerCase();

  if (ALLOWED_REASON.has(clean)) {
    return clean;
  }

  return "other";
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
