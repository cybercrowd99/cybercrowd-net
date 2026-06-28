/**
 * functions/api/value-spend-balance.js
 *
 * CyberCrowd Value Spend Balance
 *
 * ONE JOB:
 * Apply the internal debit for one approved spend request.
 *
 * This is NOT value-spend.js.
 * This is NOT value-spend-decision.js.
 * This is NOT value-limit.js.
 * This is NOT value-limit-check.js.
 * This is NOT value-balance.js.
 * This does NOT request spend.
 * This does NOT approve spend.
 * This does NOT set limits.
 * This does NOT check limits.
 * This does NOT process payments.
 * This does NOT charge cards.
 * This does NOT execute bank transfers.
 * This does NOT expose real accounts.
 * This does NOT create a PING.
 *
 * value-spend.js says:
 * a spend was requested.
 *
 * value-spend-decision.js says:
 * the spend was approved.
 *
 * value-spend-balance.js says:
 * the approved internal spend debit was applied.
 */

const SPEND_BALANCE_TTL_SECONDS = 60 * 60 * 24 * 365;
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

  const spendId = cleanText(
    body.spend_id ||
      body.spendId ||
      body.value_spend_id ||
      body.valueSpendId ||
      body.id
  );

  if (!spendId) {
    return json({ ok: false, error: "VALUE_SPEND_ID_REQUIRED" }, 400);
  }

  const spend = await readSpend(env, spendId);

  if (!spend) {
    return json({ ok: false, error: "VALUE_SPEND_NOT_FOUND" }, 404);
  }

  if (cleanText(spend.identity_id || spend.identityId) !== identityId) {
    return json({ ok: false, error: "VALUE_SPEND_ACCESS_DENIED" }, 403);
  }

  if (spend.balance_moved === true) {
    return json(
      {
        ok: false,
        error: "VALUE_SPEND_ALREADY_DEBITED",
        value_spend_id: spendId,
        balance_moved: true
      },
      409
    );
  }

  if (spend.approved !== true || cleanText(spend.decision || spend.status).toLowerCase() !== "approved") {
    return json(
      {
        ok: false,
        error: "VALUE_SPEND_NOT_APPROVED",
        value_spend_id: spendId,
        approved: spend.approved === true,
        status: cleanText(spend.status || ""),
        decision: cleanText(spend.decision || "")
      },
      409
    );
  }

  const decisionId = cleanText(
    body.decision_id ||
      body.decisionId ||
      spend.decision_id ||
      spend.decisionId ||
      ""
  );

  if (!decisionId) {
    return json({ ok: false, error: "VALUE_SPEND_DECISION_REQUIRED" }, 409);
  }

  const decision = await readDecision(env, decisionId);

  if (!decision) {
    return json({ ok: false, error: "VALUE_SPEND_DECISION_NOT_FOUND" }, 404);
  }

  if (cleanText(decision.identity_id || decision.identityId) !== identityId) {
    return json({ ok: false, error: "VALUE_SPEND_DECISION_ACCESS_DENIED" }, 403);
  }

  if (cleanText(decision.value_spend_id || decision.spend_id || decision.valueSpendId) !== spendId) {
    return json(
      {
        ok: false,
        error: "VALUE_SPEND_DECISION_MISMATCH",
        value_spend_id: spendId,
        decision_id: decisionId
      },
      409
    );
  }

  if (decision.approved !== true || cleanText(decision.decision || decision.status).toLowerCase() !== "approved") {
    return json(
      {
        ok: false,
        error: "VALUE_SPEND_DECISION_NOT_APPROVED",
        decision_id: decisionId
      },
      409
    );
  }

  const surfaceId = cleanText(
    spend.value_surface_id ||
      spend.surface_id ||
      spend.surfaceId
  );

  const surfaceRaw = await readValueSurface(env, surfaceId);

  if (!surfaceRaw) {
    return json({ ok: false, error: "VALUE_SURFACE_NOT_FOUND" }, 404);
  }

  if (cleanText(surfaceRaw.identity_id || surfaceRaw.identityId) !== identityId) {
    return json({ ok: false, error: "VALUE_SURFACE_ACCESS_DENIED" }, 403);
  }

  const surface = normalizeSurface(surfaceRaw, surfaceId);

  const amountCents = Number(spend.amount_cents || 0);
  const currency = cleanText(spend.currency || "USD").toUpperCase();

  if (amountCents <= 0) {
    return json({ ok: false, error: "VALUE_SPEND_BALANCE_AMOUNT_INVALID" }, 409);
  }

  if (surface.currency !== currency) {
    return json(
      {
        ok: false,
        error: "VALUE_SPEND_BALANCE_CURRENCY_MISMATCH",
        surface_currency: surface.currency,
        spend_currency: currency
      },
      409
    );
  }

  if (surface.balance_cents < amountCents) {
    return json(
      {
        ok: false,
        error: "INSUFFICIENT_VALUE_SURFACE_BALANCE",
        value_surface_id: surface.id,
        balance_cents: surface.balance_cents,
        amount_cents: amountCents
      },
      409
    );
  }

  const now = new Date().toISOString();
  const spendBalanceId =
    cleanText(body.spend_balance_id || body.spendBalanceId || body.balance_id || body.balanceId) ||
    makeId("VALUE_SPEND_BALANCE");

  const balanceBefore = surface.balance_cents;
  const balanceAfter = balanceBefore - amountCents;

  const spendBalance = {
    id: spendBalanceId,
    spend_balance_id: spendBalanceId,

    identity_id: identityId,
    actor_identity_id: identityId,

    value_spend_id: spendId,
    value_spend_decision_id: decisionId,
    value_surface_id: surface.id,

    amount_cents: amountCents,
    currency,

    balance_before_cents: balanceBefore,
    balance_after_cents: balanceAfter,

    balance_moved: true,
    payment_created: false,
    checkout_created: false,
    bank_transfer_executed: false,
    card_charged: false,
    real_account_exposed: false,
    ping_created: false,

    merchant: cleanText(spend.merchant || "") || null,
    label: cleanText(spend.label || "") || null,
    note: cleanText(body.note || body.description || spend.note || "") || null,

    created_at: now,
    updated_at: now,

    metadata: cleanMetadata(body.metadata)
  };

  const updatedSurface = {
    ...surfaceRaw,
    id: surface.id,
    balance_cents: balanceAfter,
    updated_at: now
  };

  const updatedSpend = {
    ...spend,
    spend_balance_id: spendBalance.id,
    balance_id: spendBalance.id,
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
    spend_balance_id: spendBalance.id,
    balance_id: spendBalance.id,
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

  await env.IDENTITY.put("value-spend-balance:" + spendBalance.id, JSON.stringify(spendBalance), {
    expirationTtl: SPEND_BALANCE_TTL_SECONDS
  });

  await env.IDENTITY.put("value-surface:" + surface.id, JSON.stringify(updatedSurface), {
    expirationTtl: SURFACE_TTL_SECONDS
  });

  await env.IDENTITY.put("value-spend:" + spendId, JSON.stringify(updatedSpend), {
    expirationTtl: SPEND_BALANCE_TTL_SECONDS
  });

  await env.IDENTITY.put("value-spend-decision:" + decisionId, JSON.stringify(updatedDecision), {
    expirationTtl: SPEND_BALANCE_TTL_SECONDS
  });

  await appendIndex(env, "value-spend-balance:index:identity:" + identityId, spendBalance.id);
  await appendIndex(env, "value-spend-balance:index:spend:" + spendId, spendBalance.id);
  await appendIndex(env, "value-spend-balance:index:decision:" + decisionId, spendBalance.id);
  await appendIndex(env, "value-spend-balance:index:surface:" + surface.id, spendBalance.id);

  await appendSync(env, identityId, {
    type: "identity_value_spend_balance_moved",
    value_spend_balance_id: spendBalance.id,
    value_spend_id: spendId,
    value_spend_decision_id: decisionId,
    value_surface_id: surface.id,
    amount_cents: amountCents,
    currency,
    balance_before_cents: balanceBefore,
    balance_after_cents: balanceAfter,
    payment_created: false,
    real_account_exposed: false,
    at: now
  });

  await appendSync(env, spendId, {
    type: "value_spend_balance_moved",
    value_spend_balance_id: spendBalance.id,
    value_spend_id: spendId,
    value_spend_decision_id: decisionId,
    value_surface_id: surface.id,
    amount_cents: amountCents,
    currency,
    balance_moved: true,
    at: now
  });

  await appendSync(env, surface.id, {
    type: "value_surface_spend_debited",
    value_spend_balance_id: spendBalance.id,
    value_spend_id: spendId,
    value_spend_decision_id: decisionId,
    identity_id: identityId,
    amount_cents: amountCents,
    currency,
    balance_before_cents: balanceBefore,
    balance_after_cents: balanceAfter,
    at: now
  });

  return json({
    ok: true,
    created: true,
    value_spend_balance_id: spendBalance.id,
    value_spend_id: spendId,
    value_spend_decision_id: decisionId,
    identity_id: identityId,
    value_surface_id: surface.id,
    amount_cents: amountCents,
    currency,
    balance_before_cents: balanceBefore,
    balance_after_cents: balanceAfter,
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

  const spendBalanceId = cleanText(
    url.searchParams.get("spend_balance_id") ||
      url.searchParams.get("spendBalanceId") ||
      url.searchParams.get("balance_id") ||
      url.searchParams.get("balanceId") ||
      url.searchParams.get("id")
  );

  if (spendBalanceId) {
    const spendBalance = await readSpendBalance(env, spendBalanceId);

    if (!spendBalance) {
      return json({ ok: false, error: "VALUE_SPEND_BALANCE_NOT_FOUND" }, 404);
    }

    if (cleanText(spendBalance.identity_id || spendBalance.identityId) !== identityId) {
      return json({ ok: false, error: "VALUE_SPEND_BALANCE_ACCESS_DENIED" }, 403);
    }

    return json({
      ok: true,
      value_spend_balance: cleanSpendBalanceForReturn(spendBalance)
    });
  }

  const ids = await readIndex(env, "value-spend-balance:index:identity:" + identityId);
  const spendBalances = [];

  for (const id of ids) {
    const spendBalance = await readSpendBalance(env, id);

    if (!spendBalance) continue;
    if (cleanText(spendBalance.identity_id || spendBalance.identityId) !== identityId) continue;

    spendBalances.push(cleanSpendBalanceForReturn(spendBalance));
  }

  return json({
    ok: true,
    identity_id: identityId,
    count: spendBalances.length,
    value_spend_balances: spendBalances,
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

async function readSpend(env, spendId) {
  const id = cleanText(spendId);
  if (!id) return null;
  return readJsonKey(env, "value-spend:" + id);
}

async function readDecision(env, decisionId) {
  const id = cleanText(decisionId);
  if (!id) return null;
  return readJsonKey(env, "value-spend-decision:" + id);
}

async function readValueSurface(env, surfaceId) {
  const id = cleanText(surfaceId);
  if (!id) return null;
  return readJsonKey(env, "value-surface:" + id);
}

async function readSpendBalance(env, spendBalanceId) {
  const id = cleanText(spendBalanceId);
  if (!id) return null;
  return readJsonKey(env, "value-spend-balance:" + id);
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

function cleanSpendBalanceForReturn(spendBalance) {
  return {
    id: spendBalance.id,
    spend_balance_id: spendBalance.spend_balance_id || spendBalance.id,
    identity_id: spendBalance.identity_id,
    value_spend_id: spendBalance.value_spend_id,
    value_spend_decision_id: spendBalance.value_spend_decision_id,
    value_surface_id: spendBalance.value_surface_id,
    amount_cents: Number(spendBalance.amount_cents || 0),
    currency: spendBalance.currency || "USD",
    balance_before_cents: Number(spendBalance.balance_before_cents || 0),
    balance_after_cents: Number(spendBalance.balance_after_cents || 0),
    balance_moved: spendBalance.balance_moved === true,
    payment_created: false,
    checkout_created: false,
    bank_transfer_executed: false,
    card_charged: false,
    real_account_exposed: false,
    ping_created: false,
    merchant: spendBalance.merchant || null,
    label: spendBalance.label || null,
    note: spendBalance.note || null,
    created_at: spendBalance.created_at || null,
    updated_at: spendBalance.updated_at || null
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
