/**
 * functions/api/relevance-check.js
 *
 * CyberCrowd Relevance Check
 *
 * ONE JOB:
 * Check whether object + intent + field is relevant before a PING is created.
 *
 * This is NOT search.
 * This is NOT chat.
 * This is NOT notification spam.
 * This does NOT create a PING.
 *
 * Relevance means:
 * an object, shot, service, event, or evidence moment matters
 * to a verified identity because it matches remembered intent
 * inside an active field.
 *
 * Flow:
 * object enters field
 *   ↓
 * proximity-enter.js records entry
 *   ↓
 * relevance-check.js decides if it matters
 *   ↓
 * ping.js creates one PING only if relevant
 */

const RELEVANCE_TTL_SECONDS = 60 * 60 * 24 * 30;
const INDEX_TTL_SECONDS = 60 * 60 * 24 * 90;
const MAX_INDEX_ITEMS = 100;

const ALLOWED_RESULT = new Set([
  "relevant",
  "not_relevant",
  "blocked",
  "needs_review"
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

  const objectId = cleanText(body.object_id || body.objectId);
  const objectHandle = cleanHandle(body.object_handle || body.objectHandle || body.handle);
  const intentId = cleanText(body.intent_id || body.intentId);
  const fieldId = cleanText(body.field_id || body.fieldId);
  const proximityId = cleanText(body.proximity_id || body.proximityId);
  const shotId = cleanText(body.shot_id || body.shotId);

  const field = fieldId
    ? await readFieldById(env, fieldId)
    : await readCurrentField(env, identityId);

  if (!field) {
    return json({
      ok: false,
      error: "FIELD_REQUIRED"
    }, 400);
  }

  if (field.identity_id !== identityId) {
    return json({
      ok: false,
      error: "FIELD_ACCESS_DENIED"
    }, 403);
  }

  if (field.status !== "active" || field.active !== true) {
    return json({
      ok: true,
      created: true,
      result: "blocked",
      reason: "field_not_active",
      field_id: field.id,
      identity_id: identityId,
      ping_created: false
    });
  }

  let object = null;

  if (objectId) {
    object = await readObject(env, objectId);
  }

  if (!object && objectHandle) {
    const resolvedObjectId = await resolveObjectHandle(env, objectHandle);

    if (resolvedObjectId) {
      object = await readObject(env, resolvedObjectId);
    }
  }

  let shot = null;

  if (shotId) {
    shot = await readShot(env, shotId);
  }

  if (!object && !shot) {
    return json({
      ok: false,
      error: "OBJECT_OR_SHOT_REQUIRED"
    }, 400);
  }

  let intents = [];

  if (intentId) {
    const intent = await readIntent(env, intentId);

    if (intent) {
      intents = [intent];
    }
  } else {
    const intentIds = await readIndex(env, "intent:index:" + identityId);

    for (const id of intentIds) {
      const intent = await readIntent(env, id);

      if (!intent) continue;
      if (intent.identity_id !== identityId) continue;
      if (intent.status !== "active") continue;

      intents.push(intent);
    }
  }

  const objectText = buildMatchText({
    object,
    shot,
    body
  });

  const match = findBestIntentMatch({
    intents,
    objectText,
    object,
    shot,
    field
  });

  const result = match.score > 0
    ? "relevant"
    : "not_relevant";

  if (!ALLOWED_RESULT.has(result)) {
    return json({
      ok: false,
      error: "RELEVANCE_RESULT_INVALID"
    }, 500);
  }

  const now = new Date().toISOString();
  const relevanceId = cleanText(
    body.relevance_id ||
    body.relevanceId
  ) || makeId("RELEVANCE");

  const relevance = {
    id: relevanceId,
    identity_id: identityId,

    result,
    relevant: result === "relevant",
    reason: match.reason,

    score: match.score,
    matched_terms: match.matched_terms,

    field_id: field.id,
    proximity_id: proximityId || null,

    object_id: object?.id || objectId || null,
    object_handle: object?.handle || objectHandle || null,

    shot_id: shot?.id || shotId || null,

    intent_id: match.intent?.id || intentId || null,
    intent_phrase: match.intent?.phrase || null,

    created_at: now,
    updated_at: now,

    metadata: cleanMetadata(body.metadata)
  };

  await env.IDENTITY.put(
    "relevance:" + relevance.id,
    JSON.stringify(relevance),
    {
      expirationTtl: RELEVANCE_TTL_SECONDS
    }
  );

  await appendIndex(env, "relevance:index:identity:" + identityId, relevance.id);
  await appendIndex(env, "relevance:index:field:" + field.id, relevance.id);
  await appendIndex(env, "relevance:index:result:" + result, relevance.id);

  if (relevance.object_id) {
    await appendIndex(env, "relevance:index:object:" + relevance.object_id, relevance.id);
  }

  if (relevance.intent_id) {
    await appendIndex(env, "relevance:index:intent:" + relevance.intent_id, relevance.id);
  }

  if (relevance.proximity_id) {
    await appendIndex(env, "relevance:index:proximity:" + relevance.proximity_id, relevance.id);
  }

  await appendSync(env, identityId, {
    type: "identity_relevance_checked",
    relevance_id: relevance.id,
    result: relevance.result,
    score: relevance.score,
    field_id: relevance.field_id,
    object_id: relevance.object_id,
    shot_id: relevance.shot_id,
    intent_id: relevance.intent_id,
    proximity_id: relevance.proximity_id,
    at: now
  });

  await appendSync(env, relevance.id, {
    type: "relevance_check_recorded",
    relevance_id: relevance.id,
    identity_id: identityId,
    result: relevance.result,
    score: relevance.score,
    reason: relevance.reason,
    at: now
  });

  if (relevance.object_id) {
    await appendSync(env, relevance.object_id, {
      type: "object_relevance_checked",
      relevance_id: relevance.id,
      identity_id: identityId,
      result: relevance.result,
      score: relevance.score,
      intent_id: relevance.intent_id,
      field_id: relevance.field_id,
      at: now
    });
  }

  if (relevance.intent_id) {
    await appendSync(env, relevance.intent_id, {
      type: "intent_relevance_checked",
      relevance_id: relevance.id,
      identity_id: identityId,
      result: relevance.result,
      score: relevance.score,
      object_id: relevance.object_id,
      field_id: relevance.field_id,
      at: now
    });
  }

  if (relevance.proximity_id) {
    await appendSync(env, relevance.proximity_id, {
      type: "proximity_relevance_checked",
      relevance_id: relevance.id,
      identity_id: identityId,
      result: relevance.result,
      score: relevance.score,
      object_id: relevance.object_id,
      intent_id: relevance.intent_id,
      at: now
    });
  }

  return json({
    ok: true,
    created: true,
    relevance_id: relevance.id,
    identity_id: identityId,
    result: relevance.result,
    relevant: relevance.relevant,
    score: relevance.score,
    reason: relevance.reason,
    matched_terms: relevance.matched_terms,
    field_id: relevance.field_id,
    proximity_id: relevance.proximity_id,
    object_id: relevance.object_id,
    object_handle: relevance.object_handle,
    shot_id: relevance.shot_id,
    intent_id: relevance.intent_id,
    intent_phrase: relevance.intent_phrase,
    ping_created: false,
    next: relevance.relevant
      ? {
          route: "/api/ping",
          method: "POST",
          reason: "relevance_confirmed"
        }
      : {
          route: null,
          method: null,
          reason: "not_relevant_no_ping"
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

  const relevanceId = cleanText(
    url.searchParams.get("relevance_id") ||
    url.searchParams.get("relevanceId") ||
    url.searchParams.get("id")
  );

  if (relevanceId) {
    const relevance = await readRelevance(env, relevanceId);

    if (!relevance) {
      return json({
        ok: false,
        error: "RELEVANCE_NOT_FOUND"
      }, 404);
    }

    if (relevance.identity_id !== identityId) {
      return json({
        ok: false,
        error: "RELEVANCE_ACCESS_DENIED"
      }, 403);
    }

    return json({
      ok: true,
      relevance: cleanRelevanceForReturn(relevance),
      ping_created: false
    });
  }

  const ids = await readIndex(env, "relevance:index:identity:" + identityId);
  const checks = [];

  for (const id of ids) {
    const relevance = await readRelevance(env, id);

    if (!relevance) continue;
    if (relevance.identity_id !== identityId) continue;

    checks.push(cleanRelevanceForReturn(relevance));
  }

  return json({
    ok: true,
    identity_id: identityId,
    count: checks.length,
    relevance_checks: checks,
    ping_created: false
  });
}

function findBestIntentMatch(input) {
  const intents = Array.isArray(input.intents) ? input.intents : [];
  const objectText = input.objectText || "";

  let best = {
    intent: null,
    score: 0,
    matched_terms: [],
    reason: "no_active_intent_match"
  };

  for (const intent of intents) {
    const terms = Array.from(
      new Set([
        ...normalizeTags(intent.tags),
        ...normalizeTags(intent.phrase)
      ])
    );

    const matched = terms.filter((term) => {
      if (!term || term.length < 2) return false;
      return objectText.includes(term);
    });

    let score = matched.length;

    if (intent.object_id && input.object?.id && intent.object_id === input.object.id) {
      score += 10;
    }

    if (intent.object_type && input.object?.type && intent.object_type === input.object.type) {
      score += 3;
    }

    if (intent.service_id && input.object?.service_id && intent.service_id === input.object.service_id) {
      score += 5;
    }

    if (score > best.score) {
      best = {
        intent,
        score,
        matched_terms: matched,
        reason: matched.length
          ? "intent_terms_matched_object"
          : "intent_direct_relation_matched"
      };
    }
  }

  return best;
}

function buildMatchText(input) {
  const parts = [];

  const object = input.object || {};
  const shot = input.shot || {};
  const body = input.body || {};

  parts.push(object.title);
  parts.push(object.description);
  parts.push(object.type);
  parts.push(object.status);
  parts.push(object.handle);
  parts.push(Array.isArray(object.tags) ? object.tags.join(" ") : "");

  parts.push(shot.title);
  parts.push(shot.description);
  parts.push(shot.class);
  parts.push(shot.hardware);
  parts.push(Array.isArray(shot.tags) ? shot.tags.join(" ") : "");

  parts.push(body.title);
  parts.push(body.description);
  parts.push(body.note);
  parts.push(Array.isArray(body.tags) ? body.tags.join(" ") : body.tags);

  return parts
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
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

  if (!id) return null;

  const raw =
    await env.IDENTITY.get("object:" + id) ||
    await env.IDENTITY.get("obj:" + id);

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function resolveObjectHandle(env, handle) {
  const clean = cleanHandle(handle);

  if (!clean) return "";

  const raw = await env.IDENTITY.get("object-handle:" + clean);

  if (!raw) return "";

  try {
    const parsed = JSON.parse(raw);

    if (typeof parsed === "string") {
      return cleanText(parsed);
    }

    if (parsed && typeof parsed === "object") {
      return cleanText(parsed.object_id || parsed.objectId || parsed.id);
    }

    return "";
  } catch {
    return cleanText(raw);
  }
}

async function readShot(env, shotId) {
  const id = cleanText(shotId);

  if (!id) return null;

  const raw = await env.IDENTITY.get("shot:" + id);

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function readIntent(env, intentId) {
  const id = cleanText(intentId);

  if (!id) return null;

  const raw = await env.IDENTITY.get("intent:" + id);

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function readCurrentField(env, identityId) {
  const raw = await env.IDENTITY.get("field:" + identityId);

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function readFieldById(env, fieldId) {
  const id = cleanText(fieldId);

  if (!id) return null;

  const raw = await env.IDENTITY.get("field:id:" + id);

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function readRelevance(env, relevanceId) {
  const id = cleanText(relevanceId);

  if (!id) return null;

  const raw = await env.IDENTITY.get("relevance:" + id);

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

function cleanRelevanceForReturn(relevance) {
  return {
    id: relevance.id,
    identity_id: relevance.identity_id,
    result: relevance.result,
    relevant: relevance.relevant === true,
    reason: relevance.reason || null,
    score: Number(relevance.score || 0),
    matched_terms: Array.isArray(relevance.matched_terms) ? relevance.matched_terms : [],
    field_id: relevance.field_id || null,
    proximity_id: relevance.proximity_id || null,
    object_id: relevance.object_id || null,
    object_handle: relevance.object_handle || null,
    shot_id: relevance.shot_id || null,
    intent_id: relevance.intent_id || null,
    intent_phrase: relevance.intent_phrase || null,
    created_at: relevance.created_at || null,
    updated_at: relevance.updated_at || null
  };
}

function normalizeTags(value) {
  if (!value) return [];

  const list = Array.isArray(value)
    ? value
    : String(value).split(/[\s,]+/);

  return Array.from(
    new Set(
      list
        .map((item) => String(item).trim().toLowerCase())
        .filter(Boolean)
    )
  );
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
