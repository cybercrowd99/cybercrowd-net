/**
 * functions/api/value-balance.js
 *
 * CyberCrowd Value Balance
 *
 * ONE JOB:
 * Move balances only after a topup request has been approved.
 *
 * This is NOT value-topup.js.
 * This is NOT value-topup-decision.js.
 * This is NOT payment processing.
 * This is NOT checkout.
 * This is NOT bank transfer execution.
 * This does NOT charge cards.
 * This does NOT expose real accounts.
 * This does NOT store banking credentials.
 * This does NOT create a PING.
 *
 * value-topup.js says:
 * a topup was requested.
 *
 * value-topup-decision.js says:
 * the request was approved.
 *
 * value-balance.js says:
 * the approved internal balance movement was applied.
 */

const BALANCE_TTL_SECONDS = 60 * 60 * 24 * 365;
const SURFACE_TTL_SECONDS = 60 * 60 * 24 * 365;
const INDEX_TTL_SECONDS = 60 * 60 * 24 * 365;
const MAX_INDEX_ITEMS = 100;

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

  const topupId = cleanText(
    body.topup_id ||
      body.topupId ||
      body.value_topup_id ||
      body.valueTopupId ||
      body.id
  );

  if (!topupId) {
    return json({ ok: false, error: "VALUE_TOPUP_ID_REQUIRED" }, 400);
  }

  const topup = await readTopup(env, topupId);

  if (!topup) {
    return json({ ok: false, error: "VALUE_TOPUP_NOT_FOUND" }, 404);
  }

  if (cleanText(topup.identity_id || topup.identityId) !== identityId) {
    return json({ ok: false, error: "VALUE_TOPUP_ACCESS_DENIED" }, 403);
  }

  if (topup.balance_moved === true) {
    return json(
      {
        ok: false,
        error: "VALUE_TOPUP_ALREADY_MOVED",
        value_topup_id: topupId,
        balance_moved: true
      },
      409
    );
  }

  if (topup.approved !== true || cleanText(topup.decision || topup.status).toLowerCase() !== "approved") {
    return json(
      {
        ok: false,
        error: "VALUE_TOPUP_NOT_APPROVED",
        value_topup_id: topupId,
        approved: topup.approved === true,
        status: cleanText(topup.status || ""),
        decision: cleanText(topup.decision || "")
      },
      409
    );
  }

  const decisionId = cleanText(
    body.decision_id ||
      body.decisionId ||
      topup.decision_id ||
      topup.decisionId ||
      ""
  );

  if (!decisionId) {
    return json({ ok: false, error: "VALUE_TOPUP_DECISION_REQUIRED" }, 409);
  }

  const decision = await readDecision(env, decisionId);

  if (!decision) {
    return json({ ok: false, error: "VALUE_TOPUP_DECISION_NOT_FOUND" }, 404);
  }

  if (cleanText(decision.identity_id || decision.identityId) !== identityId) {
    return json({ ok: false, error: "VALUE_TOPUP_DECISION_ACCESS_DENIED" }, 403);
  }

  if (cleanText(decision.value_topup_id || decision.topup_id || decision.valueTopupId) !== topupId) {
    return json(
      {
        ok: false,
        error: "VALUE_TOPUP_DECISION_MISMATCH",
        value_topup_id: topupId,
        decision_id: decisionId
      },
      409
    );
  }

  if (decision.approved !== true || cleanText(decision.decision || decision.status).toLowerCase() !== "approved") {
    return json(
      {
        ok: false,
        error: "VALUE_TOPUP_DECISION_NOT_APPROVED",
        decision_id: decisionId
      },
      409
    );
  }

  const fromSurfaceId = cleanText(topup.from_surface_id || topup.fromSurfaceId);
  const toSurfaceId = cleanText(topup.to_surface_id || topup.toSurfaceId);

  const fromSurfaceRaw = await readValueSurface(env, fromSurfaceId);
  const toSurfaceRaw = await readValueSurface(env, toSurfaceId);

  if (!fromSurfaceRaw) {
    return json({ ok: false, error: "FROM_VALUE_SURFACE_NOT_FOUND" }, 404);
  }

  if (!toSurfaceRaw) {
    return json({ ok: false, error: "TO_VALUE_SURFACE_NOT_FOUND" }, 404);
  }

  if (cleanText(fromSurfaceRaw.identity_id || fromSurfaceRaw.identityId) !== identityId) {
    return json({ ok: false, error: "FROM_VALUE_SURFACE_ACCESS_DENIED" }, 403);
  }

  if (cleanText(toSurfaceRaw.identity_id || toSurfaceRaw.identityId) !== identityId) {
    return json({ ok: false, error: "TO_VALUE_SURFACE_ACCESS_DENIED" }, 403);
  }

  const fromSurface = normalizeSurface(fromSurfaceRaw, fromSurfaceId);
  const toSurface = normalizeSurface(toSurfaceRaw, toSurfaceId);

  const amountCents = Number(topup.amount_cents || 0);
  const currency = cleanText(topup.currency || "USD").toUpperCase();

  if (amountCents <= 0) {
    return json({ ok: false, error: "VALUE_BALANCE_AMOUNT_INVALID" }, 409);
  }

  if (fromSurface.currency !== currency || toSurface.currency !== currency) {
    return json(
      {
        ok: false,
        error: "VALUE_BALANCE_CURRENCY_MISMATCH",
        from_currency: fromSurface.currency,
        to_currency: toSurface.currency,
        topup_currency: currency
      },
      409
    );
  }

  if (fromSurface.balance_cents < amountCents) {
    return json(
      {
        ok: false,
        error: "INSUFFICIENT_SOURCE_SURFACE_BALANCE",
        from_surface_id: fromSurface.id,
        balance_cents: fromSurface.balance_cents,
        amount_cents: amountCents
      },
      409
    );
  }

  const now = new Date().toISOString();
  const balanceMoveId = cleanText(body.balance_id || body.balanceId || body.id) || makeId("VALUE_BALANCE");

  const fromBefore = fromSurface.balance_cents;
  const toBefore = toSurface.balance_cents;
  const fromAfter = fromBefore - amountCents;
  const toAfter = toBefore + amountCents;

  const balanceMove = {
    id: balanceMoveId,
    balance_id: balanceMoveId,

    identity_id: identityId,
    actor_identity_id: identityId,

    value_topup_id: topupId,
    value_topup_decision_id: decisionId,

    from_surface_id: fromSurface.id,
    to_surface_id: toSurface.id,

    amount_cents: amountCents,
    currency,

    from_balance_before_cents: fromBefore,
    from_balance_after_cents: fromAfter,
    to_balance_before_cents: toBefore,
    to_balance_after_cents: toAfter,

    balance_moved: true,
    payment_created: false,
    checkout_created: false,
    bank_transfer_executed: false,
    card_charged: false,
    real_account_exposed: false,
    ping_created: false,

    note: cleanText(body.note || body.description) || null,

    created_at: now,
    updated_at: now,

    metadata: cleanMetadata(body.metadata)
  };

  const updatedFromSurface = {
    ...fromSurfaceRaw,
    id: fromSurface.id,
    balance_cents: fromAfter,
    updated_at: now
  };

  const updatedToSurface = {
    ...toSurfaceRaw,
    id: toSurface.id,
    balance_cents: toAfter,
    updated_at: now
  };

  const updatedTopup = {
    ...topup,
    balance_id: balanceMove.id,
    balance_moved: true,
    balance_moved_at: now,
    payment_created: false,
    checkout_created: false,
    bank_transfer_executed: false,
    card_charged: false,
    real_account_exposed: false,
    ping_created: false,
    updated_at: now
  };

  const updatedDecision = {
    ...decision,
    balance_id: balanceMove.id,
    balance_moved: true,
    balance_moved_at: now,
    payment_created: false,
    checkout_created: false,
    bank_transfer_executed: false,
    card_charged: false,
    real_account_exposed: false,
    ping_created: false,
    updated_at: now
  };

  await env.IDENTITY.put("value-balance:" + balanceMove.id, JSON.stringify(balanceMove), {
    expirationTtl: BALANCE_TTL_SECONDS
  });

  await env.IDENTITY.put("value-surface:" + fromSurface.id, JSON.stringify(updatedFromSurface), {
    expirationTtl: SURFACE_TTL_SECONDS
  });

  await env.IDENTITY.put("value-surface:" + toSurface.id, JSON.stringify(updatedToSurface), {
    expirationTtl: SURFACE_TTL_SECONDS
  });

  await env.IDENTITY.put("value-topup:" + topupId, JSON.stringify(updatedTopup), {
    expirationTtl: BALANCE_TTL_SECONDS
  });

  await env.IDENTITY.put("value-topup-decision:" + decisionId, JSON.stringify(updatedDecision), {
    expirationTtl: BALANCE_TTL_SECONDS
  });

  await appendIndex(env, "value-balance:index:identity:" + identityId, balanceMove.id);
  await appendIndex(env, "value-balance:index:topup:" + topupId, balanceMove.id);
  await appendIndex(env, "value-balance:index:decision:" + decisionId, balanceMove.id);
  await appendIndex(env, "value-balance:index:from:" + fromSurface.id, balanceMove.id);
  await appendIndex(env, "value-balance:index:to:" + toSurface.id, balanceMove.id);

  await appendSync(env, identityId, {
    type: "identity_value_balance_moved",
    value_balance_id: balanceMove.id,
    value_topup_id: topupId,
    value_topup_decision_id: decisionId,
    from_surface_id: fromSurface.id,
    to_surface_id: toSurface.id,
    amount_cents: amountCents,
    currency,
    payment_created: false,
    real_account_exposed: false,
    at: now
  });

  await appendSync(env, topupId, {
    type: "value_topup_balance_moved",
    value_balance_id: balanceMove.id,
    value_topup_id: topupId,
    value_topup_decision_id: decisionId,
    amount_cents: amountCents,
    currency,
    at: now
  });

  await appendSync(env, fromSurface.id, {
    type: "value_surface_balance_debited",
    value_balance_id: balanceMove.id,
    value_topup_id: topupId,
    to_surface_id: toSurface.id,
    amount_cents: amountCents,
    currency,
    balance_before_cents: fromBefore,
    balance_after_cents: fromAfter,
    at: now
  });

  await appendSync(env, toSurface.id, {
    type: "value_surface_balance_credited",
    value_balance_id: balanceMove.id,
    value_topup_id: topupId,
    from_surface_id: fromSurface.id,
    amount_cents: amountCents,
    currency,
    balance_before_cents: toBefore,
    balance_after_cents: toAfter,
    at: now
  });

  return json({
    ok: true,
    created: true,
    value_balance_id: balanceMove.id,
    value_topup_id: topupId,
    value_topup_decision_id: decisionId,
    identity_id: identityId,
    from_surface_id: fromSurface.id,
    to_surface_id: toSurface.id,
    amount_cents: amountCents,
    currency,
    from_balance_before_cents: fromBefore,
    from_balance_after_cents: fromAfter,
    to_balance_before_cents: toBefore,
    to_balance_after_cents: toAfter,
    balance_moved: true,
    payment_created: false,
    checkout_created: false,
    bank_transfer_executed: false,
    card_charged: false,
    real_account_exposed: false,
    ping_created: false
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

  const balanceId = cleanText(
    url.searchParams.get("balance_id") ||
      url.searchParams.get("balanceId") ||
      url.searchParams.get("id")
  );

  if (balanceId) {
    const balance = await readBalance(env, balanceId);

    if (!balance) {
      return json({ ok: false, error: "VALUE_BALANCE_NOT_FOUND" }, 404);
    }

    if (cleanText(balance.identity_id || balance.identityId) !== identityId) {
      return json({ ok: false, error: "VALUE_BALANCE_ACCESS_DENIED" }, 403);
    }

    return json({
      ok: true,
      value_balance: cleanBalanceForReturn(balance)
    });
  }

  const ids = await readIndex(env, "value-balance:index:identity:" + identityId);
  const balances = [];

  for (const id of ids) {
    const balance = await readBalance(env, id);

    if (!balance) continue;
    if (cleanText(balance.identity_id || balance.identityId) !== identityId) continue;

    balances.push(cleanBalanceForReturn(balance));
  }

  return json({
    ok: true,
    identity_id: identityId,
    count: balances.length,
    value_balances: balances,
    payment_created: false,
    checkout_created: false,
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

async function readTopup(env, topupId) {
  const id = cleanText(topupId);
  if (!id) return null;
  return readJsonKey(env, "value-topup:" + id);
}

async function readDecision(env, decisionId) {
  const id = cleanText(decisionId);
  if (!id) return null;
  return readJsonKey(env, "value-topup-decision:" + id);
}

async function readValueSurface(env, surfaceId) {
  const id = cleanText(surfaceId);
  if (!id) return null;
  return readJsonKey(env, "value-surface:" + id);
}

async function readBalance(env, balanceId) {
  const id = cleanText(balanceId);
  if (!id) return null;
  return readJsonKey(env, "value-balance:" + id);
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

function normalizeSurface(surface, fallbackId) {
  return {
    ...surface,
    id: cleanText(surface.id || surface.surface_id || surface.surfaceId || fallbackId),
    identity_id: cleanText(surface.identity_id || surface.identityId || ""),
    currency: cleanText(surface.currency || "USD").toUpperCase(),
    balance_cents: Number(surface.balance_cents || 0)
  };
}

function cleanBalanceForReturn(balance) {
  return {
    id: balance.id,
    balance_id: balance.balance_id || balance.id,
    identity_id: balance.identity_id,
    value_topup_id: balance.value_topup_id,
    value_topup_decision_id: balance.value_topup_decision_id,
    from_surface_id: balance.from_surface_id,
    to_surface_id: balance.to_surface_id,
    amount_cents: Number(balance.amount_cents || 0),
    currency: balance.currency || "USD",
    from_balance_before_cents: Number(balance.from_balance_before_cents || 0),
    from_balance_after_cents: Number(balance.from_balance_after_cents || 0),
    to_balance_before_cents: Number(balance.to_balance_before_cents || 0),
    to_balance_after_cents: Number(balance.to_balance_after_cents || 0),
    balance_moved: balance.balance_moved === true,
    payment_created: false,
    checkout_created: false,
    bank_transfer_executed: false,
    card_charged: false,
    real_account_exposed: false,
    ping_created: false,
    note: balance.note || null,
    created_at: balance.created_at || null,
    updated_at: balance.updated_at || null
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

  if (!match) return "";

  return match[1].trim();
}

function cleanText(value) {
  if (typeof value !== "string" && typeof value !== "number") {
    return "";
  }

  return String(value).trim();
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
