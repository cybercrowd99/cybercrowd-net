/**
 * functions/api/ping-throttle.js
 *
 * CyberCrowd PING Throttle
 *
 * ONE JOB:
 * Decide which relevant PINGs are allowed to move now.
 *
 * This is NOT email.
 * This is NOT search.
 * This is NOT display.
 * This is NOT carrier delivery.
 * This is NOT auth creation.
 *
 * Flow:
 * cybercrowd-ping-system.js
 *   ↓
 * intent-remember.js
 *   ↓
 * proximity-enter.js
 *   ↓
 * relevance-check.js
 *   ↓
 * ping-from-relevance.js
 *   ↓
 * ping-throttle.js
 *   ↓
 * carrier-route.js
 *   ↓
 * ping-delivery.js
 */

const PING_THROTTLE_TTL = 60 * 60 * 24 * 30;
const PING_THROTTLE_INDEX_TTL = 60 * 60 * 24 * 90;
const SYNC_TTL = 60 * 60 * 24 * 90;
const MAX_SYNC_ITEMS = 100;

const ALLOWED_DECISIONS = new Set([
  "silent",
  "ready_to_fire",
  "fire_now",
  "hold",
  "blocked"
]);

const ALLOWED_REASONS = new Set([
  "manual",
  "low_relevance",
  "already_seen",
  "too_many_recent",
  "quiet_surface",
  "outside_field",
  "owner_blocked",
  "receiver_blocked",
  "receiver_available",
  "high_relevance",
  "urgent_intent",
  "proximity_hot",
  "identity_selected",
  "surface_ready",
  "carrier_ready",
  "system_default"
]);

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });
}

function makeId(prefix) {
  return `${prefix}.${crypto.randomUUID()}`;
}

function nowIso() {
  return new Date().toISOString();
}

function cleanText(value, limit = 500) {
  return String(value || "").trim().slice(0, limit);
}

function cleanDecision(value) {
  const decision = cleanText(value, 60).toLowerCase();

  if (ALLOWED_DECISIONS.has(decision)) {
    return decision;
  }

  return "";
}

function cleanReason(value) {
  const reason = cleanText(value, 80).toLowerCase();

  if (ALLOWED_REASONS.has(reason)) {
    return reason;
  }

  return "system_default";
}

function parseCookie(header) {
  const out = {};

  String(header || "")
    .split(";")
    .forEach((part) => {
      const index = part.indexOf("=");
      if (index === -1) return;

      const key = part.slice(0, index).trim();
      const value = part.slice(index + 1).trim();

      if (key) out[key] = value;
    });

  return out;
}

function getBearer(request) {
  const header = request.headers.get("Authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : "";
}

function getSessionToken(request) {
  const cookies = parseCookie(request.headers.get("Cookie"));

  return (
    cookies.session ||
    cookies.cc_session ||
    cookies.EAT ||
    getBearer(request) ||
    ""
  );
}

async function readJson(env, key) {
  const raw = await env.IDENTITY.get(key);

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function requireIdentity(request, env) {
  const token = getSessionToken(request);

  if (!token) {
    return {
      ok: false,
      response: json({ ok: false, error: "session_required" }, 401)
    };
  }

  const session = await readJson(env, `session:${token}`);

  if (!session) {
    return {
      ok: false,
      response: json({ ok: false, error: "session_invalid_or_expired" }, 401)
    };
  }

  const identityId = cleanText(
    session.identity_id ||
      session.identityId ||
      session.identity_active_id ||
      session["identity-active-id"] ||
      "",
    160
  );

  if (!identityId) {
    return {
      ok: false,
      response: json({ ok: false, error: "session_identity_missing" }, 401)
    };
  }

  return {
    ok: true,
    token,
    session,
    identityId,
    email: cleanText(session.email || "", 200)
  };
}

async function appendIndex(env, key, item, ttl = PING_THROTTLE_INDEX_TTL, limit = 100) {
  const current = await readJson(env, key);
  const list = Array.isArray(current) ? current : [];

  const next = [
    item,
    ...list.filter((entry) => {
      if (!entry) return false;
      if (entry.id && item.id && entry.id === item.id) return false;
      if (entry.throttle_id && item.throttle_id && entry.throttle_id === item.throttle_id) return false;
      return true;
    })
  ].slice(0, limit);

  await env.IDENTITY.put(key, JSON.stringify(next), {
    expirationTtl: ttl
  });

  return next;
}

async function appendSync(env, targetId, entry) {
  if (!targetId) return;

  const key = `sync:${targetId}`;
  const current = await readJson(env, key);
  const list = Array.isArray(current) ? current : [];

  const next = [entry, ...list].slice(0, MAX_SYNC_ITEMS);

  await env.IDENTITY.put(key, JSON.stringify(next), {
    expirationTtl: SYNC_TTL
  });
}

function canSeePing(identityId, ping) {
  const fromId = cleanText(
    ping.from_identity_id ||
      ping.fromIdentityId ||
      ping.sender_identity_id ||
      ping.senderIdentityId ||
      "",
    160
  );

  const toId = cleanText(
    ping.to_identity_id ||
      ping.toIdentityId ||
      ping.receiver_identity_id ||
      ping.receiverIdentityId ||
      "",
    160
  );

  return identityId && (identityId === fromId || identityId === toId);
}

function normalizePingIds(ping) {
  return {
    pingId: cleanText(ping.ping_id || ping.pingId || ping.id || "", 180),
    fromIdentityId: cleanText(
      ping.from_identity_id ||
        ping.fromIdentityId ||
        ping.sender_identity_id ||
        ping.senderIdentityId ||
        "",
      160
    ),
    toIdentityId: cleanText(
      ping.to_identity_id ||
        ping.toIdentityId ||
        ping.receiver_identity_id ||
        ping.receiverIdentityId ||
        "",
      160
    ),
    objectId: cleanText(ping.object_id || ping.objectId || "", 180),
    intentId: cleanText(ping.intent_id || ping.intentId || "", 180),
    relevanceId: cleanText(ping.relevance_id || ping.relevanceId || "", 180),
    proximityId: cleanText(ping.proximity_id || ping.proximityId || "", 180),
    surfaceId: cleanText(ping.surface_id || ping.surfaceId || "", 180)
  };
}

function inferDecision({ requestedDecision, ping, recentToCount, note }) {
  if (requestedDecision) {
    return requestedDecision;
  }

  const status = cleanText(ping.status || "", 80).toLowerCase();
  const kind = cleanText(ping.kind || "", 80).toLowerCase();
  const priority = cleanText(ping.priority || "", 80).toLowerCase();

  if (status === "blocked" || status === "deleted") {
    return "blocked";
  }

  if (status === "seen" || status === "ignored" || status === "resolved") {
    return "silent";
  }

  if (recentToCount >= 12) {
    return "hold";
  }

  if (priority === "urgent" || priority === "high") {
    return "fire_now";
  }

  if (kind === "proximity_match" || kind === "human_selection") {
    return "ready_to_fire";
  }

  if (note.includes("urgent") || note.includes("now")) {
    return "fire_now";
  }

  return "ready_to_fire";
}

function inferReason({ requestedReason, decision, ping, recentToCount }) {
  if (requestedReason && requestedReason !== "system_default") {
    return requestedReason;
  }

  const status = cleanText(ping.status || "", 80).toLowerCase();
  const kind = cleanText(ping.kind || "", 80).toLowerCase();
  const priority = cleanText(ping.priority || "", 80).toLowerCase();

  if (decision === "blocked") {
    return status === "blocked" ? "owner_blocked" : "system_default";
  }

  if (decision === "silent") {
    if (status === "seen") return "already_seen";
    return "low_relevance";
  }

  if (decision === "hold") {
    if (recentToCount >= 12) return "too_many_recent";
    return "system_default";
  }

  if (decision === "fire_now") {
    if (priority === "urgent" || priority === "high") return "urgent_intent";
    return "high_relevance";
  }

  if (decision === "ready_to_fire") {
    if (kind === "proximity_match") return "proximity_hot";
    if (kind === "human_selection") return "identity_selected";
    return "receiver_available";
  }

  return "system_default";
}

async function recentThrottleCount(env, toIdentityId) {
  if (!toIdentityId) return 0;

  const list = await readJson(env, `ping-throttle:index:to:${toIdentityId}`);
  if (!Array.isArray(list)) return 0;

  const cutoff = Date.now() - 1000 * 60 * 60;
  return list.filter((item) => {
    const time = Date.parse(item.created_at || item.createdAt || "");
    return Number.isFinite(time) && time >= cutoff;
  }).length;
}

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestGet(context) {
  const { request, env } = context;

  if (!env || !env.IDENTITY) {
    return json({ ok: false, error: "identity_kv_missing" }, 500);
  }

  const auth = await requireIdentity(request, env);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const pingId = cleanText(url.searchParams.get("ping_id") || url.searchParams.get("pingId") || "", 180);
  const throttleId = cleanText(url.searchParams.get("throttle_id") || url.searchParams.get("throttleId") || "", 180);
  const limit = Math.max(1, Math.min(100, Number(url.searchParams.get("limit") || 50)));

  if (throttleId) {
    const record = await readJson(env, `ping-throttle:${throttleId}`);

    if (!record) {
      return json({ ok: false, error: "ping_throttle_not_found" }, 404);
    }

    if (
      record.actor_identity_id !== auth.identityId &&
      record.from_identity_id !== auth.identityId &&
      record.to_identity_id !== auth.identityId
    ) {
      return json({ ok: false, error: "ping_throttle_forbidden" }, 403);
    }

    return json({
      ok: true,
      throttle: record
    });
  }

  if (pingId) {
    const list = await readJson(env, `ping-throttle:index:ping:${pingId}`);
    const throttles = [];

    for (const item of Array.isArray(list) ? list.slice(0, limit) : []) {
      const record = await readJson(env, `ping-throttle:${item.throttle_id || item.id || ""}`);
      if (!record) continue;

      if (
        record.actor_identity_id === auth.identityId ||
        record.from_identity_id === auth.identityId ||
        record.to_identity_id === auth.identityId
      ) {
        throttles.push(record);
      }
    }

    return json({
      ok: true,
      throttles
    });
  }

  const list = await readJson(env, `ping-throttle:index:to:${auth.identityId}`);
  const throttles = [];

  for (const item of Array.isArray(list) ? list.slice(0, limit) : []) {
    const record = await readJson(env, `ping-throttle:${item.throttle_id || item.id || ""}`);
    if (record) throttles.push(record);
  }

  return json({
    ok: true,
    identity_id: auth.identityId,
    throttles
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env || !env.IDENTITY) {
    return json({ ok: false, error: "identity_kv_missing" }, 500);
  }

  const auth = await requireIdentity(request, env);
  if (!auth.ok) return auth.response;

  let body;

  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400);
  }

  const pingId = cleanText(body.ping_id || body.pingId || "", 180);

  if (!pingId) {
    return json({ ok: false, error: "ping_id_required" }, 400);
  }

  const ping = await readJson(env, `ping:${pingId}`);

  if (!ping) {
    return json({ ok: false, error: "ping_not_found" }, 404);
  }

  if (!canSeePing(auth.identityId, ping)) {
    return json({ ok: false, error: "ping_forbidden" }, 403);
  }

  const ids = normalizePingIds({
    ...ping,
    ping_id: pingId
  });

  const note = cleanText(body.note || body.throttle_note || body.reason_note || "", 700);
  const requestedDecision = cleanDecision(body.decision || body.throttle_decision || "");
  const requestedReason = cleanReason(body.reason || body.throttle_reason || "");

  const recentToCount = await recentThrottleCount(env, ids.toIdentityId);

  const decision = inferDecision({
    requestedDecision,
    ping,
    recentToCount,
    note: note.toLowerCase()
  });

  const reason = inferReason({
    requestedReason,
    decision,
    ping,
    recentToCount
  });

  const now = nowIso();
  const throttleId = makeId("pingThrottle");

  const throttle = {
    throttle_id: throttleId,
    id: throttleId,

    ping_id: ids.pingId,
    relevance_id: ids.relevanceId,
    proximity_id: ids.proximityId,
    object_id: ids.objectId,
    intent_id: ids.intentId,
    surface_id: ids.surfaceId,

    actor_identity_id: auth.identityId,
    from_identity_id: ids.fromIdentityId,
    to_identity_id: ids.toIdentityId,

    decision,
    reason,
    note,

    recent_to_count_1h: recentToCount,
    status: "active",

    created_at: now,
    updated_at: now
  };

  const nextPing = {
    ...ping,
    throttle_id: throttleId,
    throttle_decision: decision,
    throttle_reason: reason,
    throttled_at: now,
    updated_at: now
  };

  if (decision === "silent") {
    nextPing.status = "silent";
  }

  if (decision === "hold") {
    nextPing.status = "held";
  }

  if (decision === "blocked") {
    nextPing.status = "blocked";
  }

  if (decision === "ready_to_fire") {
    nextPing.status = "ready_to_fire";
  }

  if (decision === "fire_now") {
    nextPing.status = "fire_now";
  }

  await env.IDENTITY.put(`ping-throttle:${throttleId}`, JSON.stringify(throttle), {
    expirationTtl: PING_THROTTLE_TTL
  });

  await env.IDENTITY.put(`ping:${ids.pingId}`, JSON.stringify(nextPing), {
    expirationTtl: PING_THROTTLE_TTL
  });

  const indexItem = {
    throttle_id: throttleId,
    ping_id: ids.pingId,
    decision,
    reason,
    created_at: now
  };

  await appendIndex(env, `ping-throttle:index:ping:${ids.pingId}`, indexItem);
  await appendIndex(env, `ping-throttle:index:actor:${auth.identityId}`, indexItem);

  if (ids.fromIdentityId) {
    await appendIndex(env, `ping-throttle:index:from:${ids.fromIdentityId}`, indexItem);
  }

  if (ids.toIdentityId) {
    await appendIndex(env, `ping-throttle:index:to:${ids.toIdentityId}`, indexItem);
  }

  if (decision) {
    await appendIndex(env, `ping-throttle:index:decision:${decision}`, indexItem);
  }

  const syncEntry = {
    sync_id: makeId("sync"),
    type: "ping_throttled",
    throttle_id: throttleId,
    ping_id: ids.pingId,
    decision,
    reason,
    actor_identity_id: auth.identityId,
    created_at: now
  };

  await appendSync(env, ids.pingId, syncEntry);
  await appendSync(env, auth.identityId, syncEntry);

  if (ids.fromIdentityId && ids.fromIdentityId !== auth.identityId) {
    await appendSync(env, ids.fromIdentityId, syncEntry);
  }

  if (ids.toIdentityId && ids.toIdentityId !== auth.identityId) {
    await appendSync(env, ids.toIdentityId, syncEntry);
  }

  if (ids.objectId) {
    await appendSync(env, ids.objectId, syncEntry);
  }

  if (ids.intentId) {
    await appendSync(env, ids.intentId, syncEntry);
  }

  return json({
    ok: true,
    throttle,
    ping: nextPing,
    next:
      decision === "fire_now" || decision === "ready_to_fire"
        ? {
            route: "/api/carrier-route",
            method: "POST",
            reason: "ping_allowed_to_move"
          }
        : {
            route: null,
            method: null,
            reason: `ping_${decision}`
          }
  });
}
