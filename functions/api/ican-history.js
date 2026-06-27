/**
 * functions/api/ican-history.js
 *
 * CyberCrowd I CAN History
 *
 * ONE JOB:
 * Read one identity capability with its evidence and SYNC trail.
 *
 * This is NOT a profile.
 * This is NOT a resume form.
 * This is NOT search.
 * This is NOT chat.
 * This does NOT create a PING.
 *
 * Identity is the living resume.
 * I CAN is capability.
 * Evidence proves the capability.
 * SYNC preserves continuity.
 */

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

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

  const icanId = cleanCapabilityId(
    url.searchParams.get("ican_id") ||
    url.searchParams.get("icanId") ||
    url.searchParams.get("capability_id") ||
    url.searchParams.get("capabilityId") ||
    url.searchParams.get("id")
  );

  const limit = clampLimit(url.searchParams.get("limit"));
  const includeSync = url.searchParams.get("include_sync") !== "false";

  if (icanId) {
    const capability = await readCapability(env, icanId);

    if (!capability) {
      return json({
        ok: false,
        error: "ICAN_NOT_FOUND"
      }, 404);
    }

    if (capability.identity_id !== identityId) {
      return json({
        ok: false,
        error: "ICAN_ACCESS_DENIED"
      }, 403);
    }

    const evidence = await readEvidenceForCapability(env, capability.id, identityId, limit);
    const sync = includeSync ? await readSync(env, capability.id, limit) : [];

    return json({
      ok: true,
      identity_id: identityId,
      ican: cleanCapabilityForReturn(capability),
      count: evidence.length,
      evidence,
      sync,
      ping_created: false,
      profile_created: false,
      resume_form_created: false
    });
  }

  const ids = await readIndex(env, "ican:index:identity:" + identityId);
  const capabilities = [];

  for (const id of ids.slice(0, limit)) {
    const capability = await readCapability(env, id);

    if (!capability) continue;
    if (capability.identity_id !== identityId) continue;

    const evidenceIds = await readIndex(env, "ican-evidence:index:ican:" + capability.id);

    capabilities.push({
      ...cleanCapabilityForReturn(capability),
      evidence_count: evidenceIds.length
    });
  }

  const identitySync = includeSync ? await readSync(env, identityId, limit) : [];

  return json({
    ok: true,
    identity_id: identityId,
    count: capabilities.length,
    capabilities,
    sync: identitySync,
    ping_created: false,
    profile_created: false,
    resume_form_created: false
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

  const icanId = cleanCapabilityId(
    body.ican_id ||
    body.icanId ||
    body.capability_id ||
    body.capabilityId ||
    body.id
  );

  const limit = clampLimit(body.limit);
  const includeSync = body.include_sync !== false;

  if (icanId) {
    const capability = await readCapability(env, icanId);

    if (!capability) {
      return json({
        ok: false,
        error: "ICAN_NOT_FOUND"
      }, 404);
    }

    if (capability.identity_id !== identityId) {
      return json({
        ok: false,
        error: "ICAN_ACCESS_DENIED"
      }, 403);
    }

    const evidence = await readEvidenceForCapability(env, capability.id, identityId, limit);
    const sync = includeSync ? await readSync(env, capability.id, limit) : [];

    return json({
      ok: true,
      identity_id: identityId,
      ican: cleanCapabilityForReturn(capability),
      count: evidence.length,
      evidence,
      sync,
      ping_created: false,
      profile_created: false,
      resume_form_created: false
    });
  }

  const ids = await readIndex(env, "ican:index:identity:" + identityId);
  const capabilities = [];

  for (const id of ids.slice(0, limit)) {
    const capability = await readCapability(env, id);

    if (!capability) continue;
    if (capability.identity_id !== identityId) continue;

    const evidenceIds = await readIndex(env, "ican-evidence:index:ican:" + capability.id);

    capabilities.push({
      ...cleanCapabilityForReturn(capability),
      evidence_count: evidenceIds.length
    });
  }

  const identitySync = includeSync ? await readSync(env, identityId, limit) : [];

  return json({
    ok: true,
    identity_id: identityId,
    count: capabilities.length,
    capabilities,
    sync: identitySync,
    ping_created: false,
    profile_created: false,
    resume_form_created: false
  });
}

async function readEvidenceForCapability(env, icanId, identityId, limit) {
  const ids = await readIndex(env, "ican-evidence:index:ican:" + icanId);
  const evidence = [];

  for (const id of ids.slice(0, limit)) {
    const item = await readEvidence(env, id);

    if (!item) continue;
    if (item.identity_id !== identityId) continue;

    evidence.push(cleanEvidenceForReturn(item));
  }

  return evidence;
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

async function readCapability(env, icanId) {
  const id = cleanCapabilityId(icanId);

  if (!id) return null;

  const raw = await env.IDENTITY.get("ican:" + id);

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function readEvidence(env, evidenceId) {
  const id = cleanText(evidenceId);

  if (!id) return null;

  const raw = await env.IDENTITY.get("ican-evidence:" + id);

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function readSync(env, targetId, limit) {
  const raw = await env.IDENTITY.get("sync:" + targetId);

  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .slice(0, limit)
      .map(cleanSyncEvent);
  } catch {
    return [];
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

function cleanCapabilityForReturn(capability) {
  return {
    id: capability.id,
    identity_id: capability.identity_id,
    label: capability.label || null,
    status: capability.status || null,
    source: capability.source || null,
    description: capability.description || null,
    tags: Array.isArray(capability.tags) ? capability.tags : [],
    created_at: capability.created_at || null,
    updated_at: capability.updated_at || null
  };
}

function cleanEvidenceForReturn(evidence) {
  return {
    id: evidence.id,
    ican_id: evidence.ican_id,
    identity_id: evidence.identity_id,
    kind: evidence.kind,
    status: evidence.status,
    proof_id: evidence.proof_id || null,
    handoff_id: evidence.handoff_id || null,
    object_id: evidence.object_id || null,
    object_handle: evidence.object_handle || null,
    claim_id: evidence.claim_id || null,
    shot_id: evidence.shot_id || null,
    evidence_id: evidence.evidence_id || null,
    title: evidence.title || null,
    note: evidence.note || null,
    image_url: evidence.image_url || null,
    url: evidence.url || null,
    created_at: evidence.created_at || null,
    updated_at: evidence.updated_at || null
  };
}

function cleanSyncEvent(event) {
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
    actor_identity_id: cleanText(event.actor_identity_id || event.actorIdentityId) || null,
    owner_identity_id: cleanText(event.owner_identity_id || event.ownerIdentityId) || null,
    claimant_identity_id: cleanText(event.claimant_identity_id || event.claimantIdentityId) || null,

    ican_id: cleanText(event.ican_id || event.icanId) || null,
    evidence_id: cleanText(event.evidence_id || event.evidenceId) || null,

    proof_id: cleanText(event.proof_id || event.proofId) || null,
    handoff_id: cleanText(event.handoff_id || event.handoffId) || null,
    object_id: cleanText(event.object_id || event.objectId) || null,
    object_handle: cleanText(event.object_handle || event.objectHandle) || null,
    claim_id: cleanText(event.claim_id || event.claimId) || null,
    shot_id: cleanText(event.shot_id || event.shotId) || null,
    ping_id: cleanText(event.ping_id || event.pingId) || null,
    relevance_id: cleanText(event.relevance_id || event.relevanceId) || null,
    intent_id: cleanText(event.intent_id || event.intentId) || null,
    field_id: cleanText(event.field_id || event.fieldId) || null,

    capability: cleanText(event.capability) || null,
    kind: cleanText(event.kind) || null,
    status: cleanText(event.status) || null,
    reason: cleanText(event.reason) || null
  };

  Object.keys(cleaned).forEach((key) => {
    if (cleaned[key] === null || cleaned[key] === "") {
      delete cleaned[key];
    }
  });

  return cleaned;
}

function clampLimit(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return DEFAULT_LIMIT;
  }

  if (number < 1) return 1;
  if (number > MAX_LIMIT) return MAX_LIMIT;

  return Math.floor(number);
}

function cleanCapabilityId(value) {
  const clean = cleanText(value);

  if (!clean) return "";

  return clean
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9._:-]/g, "")
    .slice(0, 140);
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
