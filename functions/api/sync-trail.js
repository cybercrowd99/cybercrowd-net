/**
 * functions/api/sync-trail.js
 *
 * CyberCrowd SYNC Trail
 *
 * ONE JOB:
 * Read the SYNC trail for an identity, object, PING, shot,
 * intent, proximity moment, or I CAN proof.
 *
 * This is NOT search.
 * This is NOT chat.
 * This is NOT a feed.
 * This is NOT notification spam.
 * This does NOT create a PING.
 *
 * SYNC means:
 * continuity trail.
 *
 * If CyberCrowd says something happened,
 * SYNC shows what moved, when it moved,
 * what touched it, and what it became.
 */

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

const ALLOWED_TARGET_TYPES = new Set([
  "identity",
  "object",
  "ping",
  "shot",
  "intent",
  "ican",
  "evidence",
  "proximity",
  "object_moment",
  "event",
  "service",
  "job",
  "raw"
]);

export async function onRequestOptions() {
  return json({
    ok: true
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

  const viewerIdentityId = cleanText(
    session.identity_id ||
    session.identityId ||
    session.idl ||
    session.email
  );

  if (!viewerIdentityId) {
    return json({
      ok: false,
      error: "SESSION_IDENTITY_MISSING"
    }, 401);
  }

  const url = new URL(request.url);

  const targetType = cleanText(
    url.searchParams.get("type") ||
    url.searchParams.get("target_type") ||
    url.searchParams.get("targetType") ||
    "identity"
  ).toLowerCase();

  if (!ALLOWED_TARGET_TYPES.has(targetType)) {
    return json({
      ok: false,
      error: "SYNC_TARGET_TYPE_NOT_ALLOWED",
      allowed: Array.from(ALLOWED_TARGET_TYPES)
    }, 400);
  }

  const targetId = cleanText(
    url.searchParams.get("id") ||
    url.searchParams.get("target_id") ||
    url.searchParams.get("targetId")
  ) || viewerIdentityId;

  if (!targetId) {
    return json({
      ok: false,
      error: "SYNC_TARGET_ID_REQUIRED"
    }, 400);
  }

  const limit = clampLimit(url.searchParams.get("limit"));
  const includeRaw = url.searchParams.get("include_raw") === "true";

  const access = await canReadSync(env, {
    viewerIdentityId,
    targetType,
    targetId
  });

  if (!access.allowed) {
    return json({
      ok: false,
      error: "SYNC_ACCESS_DENIED",
      reason: access.reason
    }, 403);
  }

  const trail = await readSync(env, targetId);
  const cleaned = trail
    .slice(0, limit)
    .map((event) => cleanSyncEvent(event, includeRaw));

  return json({
    ok: true,
    viewer_identity_id: viewerIdentityId,
    target_type: targetType,
    target_id: targetId,
    count: cleaned.length,
    sync: cleaned
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

  const viewerIdentityId = cleanText(
    session.identity_id ||
    session.identityId ||
    session.idl ||
    session.email
  );

  if (!viewerIdentityId) {
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

  const targetType = cleanText(
    body.type ||
    body.target_type ||
    body.targetType ||
    "identity"
  ).toLowerCase();

  if (!ALLOWED_TARGET_TYPES.has(targetType)) {
    return json({
      ok: false,
      error: "SYNC_TARGET_TYPE_NOT_ALLOWED",
      allowed: Array.from(ALLOWED_TARGET_TYPES)
    }, 400);
  }

  const targetId = cleanText(
    body.id ||
    body.target_id ||
    body.targetId
  ) || viewerIdentityId;

  if (!targetId) {
    return json({
      ok: false,
      error: "SYNC_TARGET_ID_REQUIRED"
    }, 400);
  }

  const limit = clampLimit(body.limit);
  const includeRaw = body.include_raw === true;

  const access = await canReadSync(env, {
    viewerIdentityId,
    targetType,
    targetId
  });

  if (!access.allowed) {
    return json({
      ok: false,
      error: "SYNC_ACCESS_DENIED",
      reason: access.reason
    }, 403);
  }

  const trail = await readSync(env, targetId);
  const cleaned = trail
    .slice(0, limit)
    .map((event) => cleanSyncEvent(event, includeRaw));

  return json({
    ok: true,
    viewer_identity_id: viewerIdentityId,
    target_type: targetType,
    target_id: targetId,
    count: cleaned.length,
    sync: cleaned
  });
}

async function canReadSync(env, input) {
  const viewerIdentityId = input.viewerIdentityId;
  const targetType = input.targetType;
  const targetId = input.targetId;

  if (targetType === "identity") {
    if (targetId === viewerIdentityId) {
      return {
        allowed: true,
        reason: "viewer_owns_identity"
      };
    }

    const publicIdentity = await readJsonKey(env, "identity:public:" + targetId);

    if (publicIdentity && publicIdentity.public === true) {
      return {
        allowed: true,
        reason: "public_identity_sync"
      };
    }

    return {
      allowed: false,
      reason: "identity_private"
    };
  }

  if (targetType === "raw") {
    if (targetId === viewerIdentityId) {
      return {
        allowed: true,
        reason: "viewer_raw_self"
      };
    }

    return {
      allowed: false,
      reason: "raw_sync_private"
    };
  }

  const ownership = await inferOwnership(env, targetType, targetId);

  if (!ownership.owner_identity_id) {
    return {
      allowed: true,
      reason: "ownership_unknown_read_allowed"
    };
  }

  if (ownership.owner_identity_id === viewerIdentityId) {
    return {
      allowed: true,
      reason: "viewer_owns_target"
    };
  }

  if (ownership.public === true) {
    return {
      allowed: true,
      reason: "target_public"
    };
  }

  return {
    allowed: false,
    reason: "target_private"
  };
}

async function inferOwnership(env, targetType, targetId) {
  const readers = {
    object: ["object:", "obj:"],
    ping: ["ping:"],
    shot: ["shot:"],
    intent: ["intent:"],
    ican: ["ican:"],
    evidence: ["ican-evidence:"],
    proximity: ["proximity:", "proximity-exit:"],
    object_moment: ["object-moment:"],
    event: ["event:"],
    service: ["service:"],
    job: ["job:"]
  };

  const prefixes = readers[targetType] || [];

  for (const prefix of prefixes) {
    const record = await readJsonKey(env, prefix + targetId);

    if (!record) continue;

    return {
      owner_identity_id: cleanText(
        record.owner_identity_id ||
        record.ownerIdentityId ||
        record.identity_id ||
        record.identityId ||
        record.to_identity_id ||
        record.toIdentityId
      ),
      public: record.public === true
    };
  }

  return {
    owner_identity_id: "",
    public: false
  };
}

async function readSync(env, targetId) {
  const raw = await env.IDENTITY.get("sync:" + targetId);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed)) {
      return parsed;
    }

    return [];
  } catch {
    return [];
  }
}

async function readJsonKey(env, key) {
  const raw = await env.IDENTITY.get(key);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function cleanSyncEvent(event, includeRaw) {
  if (!event || typeof event !== "object") {
    return {
      type: "unknown",
      at: null
    };
  }

  const cleaned = {
    sync_id: cleanText(event.sync_id || event.syncId) || null,
    type: cleanText(event.type) || "unknown",
    at: cleanText(event.at || event.created_at || event.createdAt) || null,

    identity_id: cleanText(event.identity_id || event.identityId) || null,
    owner_identity_id: cleanText(event.owner_identity_id || event.ownerIdentityId) || null,
    observer_identity_id: cleanText(event.observer_identity_id || event.observerIdentityId) || null,

    object_id: cleanText(event.object_id || event.objectId) || null,
    object_handle: cleanText(event.object_handle || event.objectHandle) || null,

    ping_id: cleanText(event.ping_id || event.pingId) || null,
    shot_id: cleanText(event.shot_id || event.shotId) || null,
    intent_id: cleanText(event.intent_id || event.intentId) || null,
    ican_id: cleanText(event.ican_id || event.icanId) || null,
    evidence_id: cleanText(event.evidence_id || event.evidenceId) || null,
    event_id: cleanText(event.event_id || event.eventId) || null,
    service_id: cleanText(event.service_id || event.serviceId) || null,
    job_id: cleanText(event.job_id || event.jobId) || null,

    proximity_id: cleanText(event.proximity_id || event.proximityId) || null,
    proximity_exit_id: cleanText(event.proximity_exit_id || event.proximityExitId) || null,
    object_moment_id: cleanText(event.object_moment_id || event.objectMomentId) || null,

    action: cleanText(event.action) || null,
    status: cleanText(event.status) || null,
    reason: cleanText(event.reason) || null
  };

  Object.keys(cleaned).forEach((key) => {
    if (cleaned[key] === null || cleaned[key] === "") {
      delete cleaned[key];
    }
  });

  if (includeRaw) {
    cleaned.raw = cleanRawEvent(event);
  }

  return cleaned;
}

function cleanRawEvent(event) {
  const cleaned = {};

  Object.keys(event).forEach((key) => {
    const lower = key.toLowerCase();

    if (
      lower.includes("password") ||
      lower.includes("secret") ||
      lower.includes("token") ||
      lower.includes("cookie")
    ) {
      return;
    }

    const item = event[key];

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

function clampLimit(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return DEFAULT_LIMIT;
  }

  if (number < 1) {
    return 1;
  }

  if (number > MAX_LIMIT) {
    return MAX_LIMIT;
  }

  return Math.floor(number);
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

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
    }
