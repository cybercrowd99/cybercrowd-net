/**
 * functions/api/value-receipt.js
 *
 * CyberCrowd Value Receipt
 *
 * ONE JOB:
 * Attach receipt/proof notes to one completed value spend.
 *
 * This is NOT value-spend.js.
 * This is NOT value-spend-decision.js.
 * This is NOT value-spend-balance.js.
 * This is NOT value-history.js.
 * This does NOT request spend.
 * This does NOT approve spend.
 * This does NOT move balances.
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
 * the spend was approved or blocked.
 *
 * value-spend-balance.js says:
 * the internal debit was applied.
 *
 * value-receipt.js says:
 * proof/receipt notes were attached to that completed spend.
 */

const RECEIPT_TTL_SECONDS = 60 * 60 * 24 * 365;
const SPEND_TTL_SECONDS = 60 * 60 * 24 * 365;
const INDEX_TTL_SECONDS = 60 * 60 * 24 * 365;
const MAX_INDEX_ITEMS = 100;

const ALLOWED_RECEIPT_KIND = new Set([
  "manual",
  "note",
  "image_ref",
  "email_ref",
  "order_ref",
  "merchant_ref",
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

  if (spend.balance_moved !== true) {
    return json(
      {
        ok: false,
        error: "VALUE_SPEND_NOT_COMPLETED",
        value_spend_id: spendId,
        balance_moved: spend.balance_moved === true
      },
      409
    );
  }

  const receiptKind = normalizeReceiptKind(
    body.receipt_kind ||
      body.receiptKind ||
      body.kind ||
      "manual"
  );

  const receiptText = cleanText(
    body.receipt_text ||
      body.receiptText ||
      body.text ||
      body.note ||
      body.description ||
      ""
  );

  const reference = cleanText(
    body.reference ||
      body.receipt_reference ||
      body.receiptReference ||
      body.order_id ||
      body.orderId ||
      body.merchant_reference ||
      body.merchantReference ||
      ""
  );

  if (!receiptText && !reference) {
    return json({ ok: false, error: "VALUE_RECEIPT_PROOF_REQUIRED" }, 400);
  }

  const now = new Date().toISOString();
  const receiptId =
    cleanText(body.receipt_id || body.receiptId || body.value_receipt_id || body.valueReceiptId) ||
    makeId("VALUE_RECEIPT");

  const surfaceId = cleanText(
    spend.value_surface_id ||
      spend.surface_id ||
      spend.surfaceId ||
      ""
  );

  const receipt = {
    id: receiptId,
    receipt_id: receiptId,

    identity_id: identityId,
    actor_identity_id: identityId,

    value_spend_id: spendId,
    value_spend_balance_id: cleanText(spend.spend_balance_id || spend.balance_id || spend.balanceId || ""),
    value_surface_id: surfaceId,

    receipt_kind: receiptKind,
    receipt_text: receiptText || null,
    reference: reference || null,

    merchant: cleanText(body.merchant || spend.merchant || "") || null,
    label: cleanText(body.label || spend.label || "") || null,

    amount_cents: Number(spend.amount_cents || 0),
    currency: cleanText(spend.currency || "USD").toUpperCase(),

    receipt_attached: true,
    balance_moved: true,
    payment_created: false,
    checkout_created: false,
    bank_transfer_executed: false,
    card_charged: false,
    real_account_exposed: false,
    ping_created: false,

    created_at: now,
    updated_at: now,

    metadata: cleanMetadata(body.metadata)
  };

  const existingReceiptIds = Array.isArray(spend.receipt_ids)
    ? spend.receipt_ids.filter((item) => typeof item === "string" && item.trim())
    : [];

  const updatedSpend = {
    ...spend,
    receipt_attached: true,
    receipt_id: receipt.id,
    receipt_ids: [receipt.id, ...existingReceiptIds.filter((id) => id !== receipt.id)].slice(0, MAX_INDEX_ITEMS),
    receipt_updated_at: now,
    payment_created: false,
    checkout_created: false,
    bank_transfer_executed: false,
    card_charged: false,
    real_account_exposed: false,
    ping_created: false,
    updated_at: now
  };

  await env.IDENTITY.put("value-receipt:" + receipt.id, JSON.stringify(receipt), {
    expirationTtl: RECEIPT_TTL_SECONDS
  });

  await env.IDENTITY.put("value-spend:" + spendId, JSON.stringify(updatedSpend), {
    expirationTtl: SPEND_TTL_SECONDS
  });

  await appendIndex(env, "value-receipt:index:identity:" + identityId, receipt.id);
  await appendIndex(env, "value-receipt:index:spend:" + spendId, receipt.id);
  await appendIndex(env, "value-receipt:index:surface:" + surfaceId, receipt.id);
  await appendIndex(env, "value-receipt:index:kind:" + receiptKind, receipt.id);

  await appendSync(env, identityId, {
    type: "identity_value_receipt_attached",
    value_receipt_id: receipt.id,
    value_spend_id: spendId,
    value_surface_id: surfaceId,
    receipt_kind: receiptKind,
    amount_cents: receipt.amount_cents,
    currency: receipt.currency,
    payment_created: false,
    real_account_exposed: false,
    at: now
  });

  await appendSync(env, spendId, {
    type: "value_spend_receipt_attached",
    value_receipt_id: receipt.id,
    value_spend_id: spendId,
    identity_id: identityId,
    value_surface_id: surfaceId,
    receipt_kind: receiptKind,
    at: now
  });

  if (surfaceId) {
    await appendSync(env, surfaceId, {
      type: "value_surface_receipt_attached",
      value_receipt_id: receipt.id,
      value_spend_id: spendId,
      identity_id: identityId,
      receipt_kind: receiptKind,
      amount_cents: receipt.amount_cents,
      currency: receipt.currency,
      at: now
    });
  }

  return json({
    ok: true,
    created: true,
    value_receipt_id: receipt.id,
    value_spend_id: spendId,
    identity_id: identityId,
    value_surface_id: surfaceId || null,
    receipt_kind: receiptKind,
    receipt_attached: true,
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

  const receiptId = cleanText(
    url.searchParams.get("receipt_id") ||
      url.searchParams.get("receiptId") ||
      url.searchParams.get("value_receipt_id") ||
      url.searchParams.get("valueReceiptId") ||
      url.searchParams.get("id")
  );

  if (receiptId) {
    const receipt = await readReceipt(env, receiptId);

    if (!receipt) {
      return json({ ok: false, error: "VALUE_RECEIPT_NOT_FOUND" }, 404);
    }

    if (cleanText(receipt.identity_id || receipt.identityId) !== identityId) {
      return json({ ok: false, error: "VALUE_RECEIPT_ACCESS_DENIED" }, 403);
    }

    return json({
      ok: true,
      value_receipt: cleanReceiptForReturn(receipt)
    });
  }

  const spendId = cleanText(
    url.searchParams.get("spend_id") ||
      url.searchParams.get("spendId") ||
      url.searchParams.get("value_spend_id") ||
      url.searchParams.get("valueSpendId")
  );

  const surfaceId = cleanText(
    url.searchParams.get("surface_id") ||
      url.searchParams.get("surfaceId") ||
      url.searchParams.get("value_surface_id") ||
      url.searchParams.get("valueSurfaceId")
  );

  const key = spendId
    ? "value-receipt:index:spend:" + spendId
    : surfaceId
      ? "value-receipt:index:surface:" + surfaceId
      : "value-receipt:index:identity:" + identityId;

  const ids = await readIndex(env, key);
  const receipts = [];

  for (const id of ids) {
    const receipt = await readReceipt(env, id);

    if (!receipt) continue;
    if (cleanText(receipt.identity_id || receipt.identityId) !== identityId) continue;

    receipts.push(cleanReceiptForReturn(receipt));
  }

  return json({
    ok: true,
    identity_id: identityId,
    count: receipts.length,
    value_receipts: receipts,
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

async function readReceipt(env, receiptId) {
  const id = cleanText(receiptId);
  if (!id) return null;
  return readJsonKey(env, "value-receipt:" + id);
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

function cleanReceiptForReturn(receipt) {
  return {
    id: receipt.id,
    receipt_id: receipt.receipt_id || receipt.id,
    identity_id: receipt.identity_id,
    value_spend_id: receipt.value_spend_id,
    value_spend_balance_id: receipt.value_spend_balance_id || null,
    value_surface_id: receipt.value_surface_id || null,
    receipt_kind: receipt.receipt_kind || "manual",
    receipt_text: receipt.receipt_text || null,
    reference: receipt.reference || null,
    merchant: receipt.merchant || null,
    label: receipt.label || null,
    amount_cents: Number(receipt.amount_cents || 0),
    currency: receipt.currency || "USD",
    receipt_attached: receipt.receipt_attached === true,
    balance_moved: receipt.balance_moved === true,
    payment_created: false,
    checkout_created: false,
    bank_transfer_executed: false,
    card_charged: false,
    real_account_exposed: false,
    ping_created: false,
    created_at: receipt.created_at || null,
    updated_at: receipt.updated_at || null
  };
}

function normalizeReceiptKind(value) {
  const clean = cleanText(value || "manual").toLowerCase();

  if (clean === "image") return "image_ref";
  if (clean === "email") return "email_ref";
  if (clean === "order") return "order_ref";
  if (clean === "merchant") return "merchant_ref";

  if (ALLOWED_RECEIPT_KIND.has(clean)) {
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
