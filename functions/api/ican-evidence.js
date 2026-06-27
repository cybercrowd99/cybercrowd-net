/**
 * functions/api/ican-evidence.js
 *
 * CyberCrowd I CAN Evidence
 *
 * ONE JOB:
 * Attach evidence to Identity / I CAN without making a profile.
 *
 * This is NOT a profile.
 * This is NOT chat.
 * This is NOT search.
 * This is NOT a resume form.
 * This does NOT create a PING.
 *
 * I CAN means:
 * identity carries capability.
 *
 * Evidence means:
 * proof attached to that capability:
 * shot, object, job, service, event, link, customer record,
 * work record, media, sale, repair, build, teaching moment,
 * or other CyberCrowd proof.
 *
 * Flow:
 * identity says I CAN
 *   ↓
 * evidence attaches
 *   ↓
 * capability gains proof
 *   ↓
 * proximity / object / PING can use the evidence later
 */

const ICAN_TTL_SECONDS = 60 * 60 * 24 * 365;
const INDEX_TTL_SECONDS = 60 * 60 * 24 * 365;
const MAX_INDEX_ITEMS = 100;

const ALLOWED_EVIDENCE_KIND = new Set([
  "shot",
  "object",
  "event",
  "service",
  "job",
  "sale",
  "repair",
  "build",
  "teaching",
  "media",
  "link",
  "customer",
  "reference",
  "work_record",
  "other"
]);

const ALLOWED_STATUS = new Set([
  "active",
  "pending",
  "review",
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

  const statement = cleanText(
    body.statement ||
    body.ican ||
    body.i_can ||
    body.capability ||
    body.title
  );

  if (!statement) {
    return json({
      ok: false,
      error: "ICAN_STATEMENT_REQUIRED"
    }, 400);
  }

  const evidenceKind = cleanText(
    body.evidence_kind ||
    body.evidenceKind ||
    body.kind ||
    "other"
  ).toLowerCase();

  if (!ALLOWED_EVIDENCE_KIND.has(evidenceKind)) {
    return json({
      ok: false,
      error: "EVIDENCE_KIND_NOT_ALLOWED",
      allowed: Array.from(ALLOWED_EVIDENCE_KIND)
    }, 400);
  }

  const status = cleanText(body.status || "active").toLowerCase();

  if (!ALLOWED_STATUS.has(status)) {
    return json({
      ok: false,
      error: "ICAN_STATUS_NOT_ALLOWED",
      allowed: Array.from(ALLOWED_STATUS)
    }, 400);
  }

  const icanId = cleanText(
    body.ican_id ||
    body.icanId ||
    body.capability_id ||
    body.capabilityId
  ) || makeId("ICAN");

  const evidenceId = cleanText(
    body.evidence_id ||
    body.evidenceId
  ) || makeId("EVIDENCE");

  const now = new Date().toISOString();

  const evidence = {
    id: evidenceId,
    ican_id: icanId,
    identity_id: identityId,

    statement,
    status,

    evidence_kind: evidenceKind,

    object_id: cleanText(body.object_id || body.objectId) || null,
    object_handle: cleanHandle(body.object_handle || body.objectHandle || body.handle) || null,

    shot_id: cleanText(body.shot_id || body.shotId) || null,
    event_id: cleanText(body.event_id || body.eventId) || null,
    service_id: cleanText(body.service_id || body.serviceId) || null,
    job_id: cleanText(body.job_id || body.jobId) || null,
    customer_id: cleanText(body.customer_id || body.customerId) || null,

    title: cleanText(body.evidence_title || body.evidenceTitle || body.name) || null,
    description: cleanText(body.description || body.note) || null,

    url: cleanText(body.url || body.href || body.link_url || body.linkUrl) || null,
    image_url: cleanText(
      body.image_url ||
      body.imageUrl ||
      body.photo_url ||
      body.photoUrl
    ) || null,

    tags: normalizeTags(body.tags || body.keywords || statement),
    area: normalizeArea(body.area),

    created_at: now,
    updated_at: now,

    metadata: cleanMetadata(body.metadata)
  };

  const capability = await upsertICan(env, {
    id: icanId,
    identity_id: identityId,
    statement,
    status,
    tags: evidence.tags,
    now
  });

  await env.IDENTITY.put(
    "ican-evidence:" + evidence.id,
    JSON.stringify(evidence),
    {
      expirationTtl: ICAN_TTL_SECONDS
    }
  );

  await appendIndex(env, "ican:index:" + identityId, capability.id);
  await appendIndex(env, "ican:index:statement:" + identityId + ":" + slug(statement), capability.id);
  await appendIndex(env, "ican-evidence:index:ican:" + capability.id, evidence.id);
  await appendIndex(env, "ican-evidence:index:identity:" + identityId, evidence.id);
  await appendIndex(env, "ican-evidence:index:kind:" + evidence.evidence_kind, evidence.id);

  if (evidence.object_id) {
    await appendIndex(env, "ican-evidence:index:object:" + evidence.object_id, evidence.id);
  }

  if (evidence.shot_id) {
    await appendIndex(env, "ican-evidence:index:shot:" + evidence.shot_id, evidence.id);
  }

  if (evidence.event_id) {
    await appendIndex(env, "ican-evidence:index:event:" + evidence.event_id, evidence.id);
  }

  await appendSync(env, capability.id, {
    type: "ican_evidence_attached",
    ican_id: capability.id,
    evidence_id: evidence.id,
    identity_id: identityId,
    statement,
    evidence_kind: evidence.evidence_kind,
    object_id: evidence.object_id,
    shot_id: evidence.shot_id,
    event_id: evidence.event_id,
    at: now
  });

  await appendSync(env, identityId, {
    type: "identity_ican_evidence_attached",
    ican_id: capability.id,
    evidence_id: evidence.id,
    statement,
    evidence_kind: evidence.evidence_kind,
    object_id: evidence.object_id,
    shot_id: evidence.shot_id,
    event_id: evidence.event_id,
    at: now
  });

  if (evidence.object_id) {
    await appendSync(env, evidence.object_id, {
      type: "object_supports_ican",
      ican_id: capability.id,
      evidence_id: evidence.id,
      identity_id: identityId,
      statement,
      at: now
    });
  }

  if (evidence.shot_id) {
    await appendSync(env, evidence.shot_id, {
      type: "shot_supports_ican",
      ican_id: capability.id,
      evidence_id: evidence.id,
      identity_id: identityId,
      statement,
      at: now
    });
  }

  if (evidence.event_id) {
    await appendSync(env, evidence.event_id, {
      type: "event_supports_ican",
      ican_id: capability.id,
      evidence_id: evidence.id,
      identity_id: identityId,
      statement,
      at: now
    });
  }

  return json({
    ok: true,
    created: true,
    ican_id: capability.id,
    evidence_id: evidence.id,
    identity_id: identityId,
    statement,
    evidence_kind: evidence.evidence_kind,
    status: evidence.status,
    object_id: evidence.object_id,
    shot_id: evidence.shot_id,
    event_id: evidence.event_id,
    ping_created: false,
    next: {
      route: "/api/proximity-enter",
      method: "POST",
      reason: "ican_evidence_ready_for_relevance"
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
  const icanId = cleanText(url.searchParams.get("ican_id") || url.searchParams.get("icanId"));

  if (icanId) {
    const evidenceIds = await readIndex(env, "ican-evidence:index:ican:" + icanId);
    const evidence = [];

    for (const id of evidenceIds) {
      const item = await readEvidence(env, id);

      if (!item) continue;
      if (item.identity_id !== identityId) continue;

      evidence.push(cleanEvidenceForReturn(item));
    }

    return json({
      ok: true,
      identity_id: identityId,
      ican_id: icanId,
      count: evidence.length,
      evidence
    });
  }

  const ids = await readIndex(env, "ican:index:" + identityId);
  const capabilities = [];

  for (const id of ids) {
    const capability = await readICan(env, id);

    if (!capability) continue;
    if (capability.identity_id !== identityId) continue;

    capabilities.push(cleanICanForReturn(capability));
  }

  return json({
    ok: true,
    identity_id: identityId,
    count: capabilities.length,
    capabilities
  });
}

async function upsertICan(env, input) {
  const existing = await readICan(env, input.id);

  const capability = {
    id: input.id,
    identity_id: input.identity_id,
    statement: input.statement,
    status: input.status || "active",
    active: input.status !== "archived",
    tags: Array.from(new Set([
      ...normalizeTags(existing?.tags),
      ...normalizeTags(input.tags)
    ])),
    evidence_count: Number(existing?.evidence_count || 0) + 1,
    created_at: existing?.created_at || input.now,
    updated_at: input.now,
    metadata: existing?.metadata || {}
  };

  await env.IDENTITY.put(
    "ican:" + capability.id,
    JSON.stringify(capability),
    {
      expirationTtl: ICAN_TTL_SECONDS
    }
  );

  return capability;
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

async function readICan(env, icanId) {
  const id = cleanText(icanId);

  if (!id) {
    return null;
  }

  const raw = await env.IDENTITY.get("ican:" + id);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function readEvidence(env, evidenceId) {
  const id = cleanText(evidenceId);

  if (!id) {
    return null;
  }

  const raw = await env.IDENTITY.get("ican-evidence:" + id);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function readIndex(env, key) {
  const raw = await env.IDENTITY.get(key);

  if (!raw) {
    return [];
  }

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

function cleanICanForReturn(capability) {
  return {
    id: capability.id,
    identity_id: capability.identity_id,
    statement: capability.statement,
    status: capability.status,
    active: capability.active === true,
    tags: Array.isArray(capability.tags) ? capability.tags : [],
    evidence_count: Number(capability.evidence_count || 0),
    created_at: capability.created_at || null,
    updated_at: capability.updated_at || null
  };
}

function cleanEvidenceForReturn(evidence) {
  return {
    id: evidence.id,
    ican_id: evidence.ican_id,
    identity_id: evidence.identity_id,
    statement: evidence.statement,
    status: evidence.status,
    evidence_kind: evidence.evidence_kind,
    object_id: evidence.object_id || null,
    object_handle: evidence.object_handle || null,
    shot_id: evidence.shot_id || null,
    event_id: evidence.event_id || null,
    service_id: evidence.service_id || null,
    job_id: evidence.job_id || null,
    title: evidence.title || null,
    description: evidence.description || null,
    url: evidence.url || null,
    image_url: evidence.image_url || null,
    tags: Array.isArray(evidence.tags) ? evidence.tags : [],
    area: evidence.area || null,
    created_at: evidence.created_at || null,
    updated_at: evidence.updated_at || null
  };
}

function slug(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
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
