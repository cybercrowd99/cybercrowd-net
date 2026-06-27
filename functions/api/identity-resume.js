/**
 * functions/api/identity-resume.js
 *
 * CyberCrowd Identity Resume
 *
 * ONE JOB:
 * Read identity as a living resume through I CAN evidence.
 *
 * This is NOT a profile.
 * This is NOT a resume form.
 * This is NOT search.
 * This is NOT chat.
 * This does NOT create a PING.
 *
 * Identity is the living resume.
 * I CAN is capability.
 * Evidence proves capability.
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

  const targetIdentityId = cleanText(
    url.searchParams.get("identity_id") ||
    url.searchParams.get("identityId") ||
    url.searchParams.get("id") ||
    viewerIdentityId
  );

  const limit = clampLimit(url.searchParams.get("limit"));
  const includeSync = url.searchParams.get("include_sync") !== "false";
  const includeEvidence = url.searchParams.get("include_evidence") !== "false";

  if (targetIdentityId !== viewerIdentityId) {
    const canRead = await canReadIdentityResume(env, targetIdentityId, viewerIdentityId);

    if (!canRead) {
      return json({
        ok: false,
        error: "IDENTITY_RESUME_ACCESS_DENIED"
      }, 403);
    }
  }

  const capabilities = await readCapabilities(env, targetIdentityId, limit, includeEvidence);
  const evidence = await readIdentityEvidence(env, targetIdentityId, limit);
  const objects = await readIdentityObjects(env, targetIdentityId, limit);
  const handoffs = await readIdentityHandoffs(env, targetIdentityId, limit);
  const proofs = await readIdentityProofs(env, targetIdentityId, limit);
  const sync = includeSync ? await readSync(env, targetIdentityId, limit) : [];

  return json({
    ok: true,
    viewer_identity_id: viewerIdentityId,
    identity_id: targetIdentityId,

    living_resume: {
      identity_id: targetIdentityId,
      capability_count: capabilities.length,
      evidence_count: evidence.length,
      object_count: objects.length,
      handoff_count: handoffs.length,
      proof_count: proofs.length
    },

    capabilities,
    evidence,
    objects,
    handoffs,
    proofs,
    sync,

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

  const targetIdentityId = cleanText(
    body.identity_id ||
    body.identityId ||
    body.id ||
    viewerIdentityId
  );

  const limit = clampLimit(body.limit);
  const includeSync = body.include_sync !== false;
  const includeEvidence = body.include_evidence !== false;

  if (targetIdentityId !== viewerIdentityId) {
    const canRead = await canReadIdentityResume(env, targetIdentityId, viewerIdentityId);

    if (!canRead) {
      return json({
        ok: false,
        error: "IDENTITY_RESUME_ACCESS_DENIED"
      }, 403);
    }
  }

  const capabilities = await readCapabilities(env, targetIdentityId, limit, includeEvidence);
  const evidence = await readIdentityEvidence(env, targetIdentityId, limit);
  const objects = await readIdentityObjects(env, targetIdentityId, limit);
  const handoffs = await readIdentityHandoffs(env, targetIdentityId, limit);
  const proofs = await readIdentityProofs(env, targetIdentityId, limit);
  const sync = includeSync ? await readSync(env, targetIdentityId, limit) : [];

  return json({
    ok: true,
    viewer_identity_id: viewerIdentityId,
    identity_id: targetIdentityId,

    living_resume: {
      identity_id: targetIdentityId,
      capability_count: capabilities.length,
      evidence_count: evidence.length,
      object_count: objects.length,
      handoff_count: handoffs.length,
      proof_count: proofs.length
    },

    capabilities,
    evidence,
    objects,
    handoffs,
    proofs,
    sync,

    ping_created: false,
    profile_created: false,
    resume_form_created: false
  });
}

async function canReadIdentityResume(env, targetIdentityId, viewerIdentityId) {
  if (targetIdentityId === viewerIdentityId) {
    return true;
  }

  const identity = await readIdentity(env, targetIdentityId);

  if (!identity) {
    return false;
  }

  if (identity.public_resume === true) return true;
  if (identity.resume_public === true) return true;
  if (identity.public === true) return true;

  return false;
}

async function readCapabilities(env, identityId, limit, includeEvidence) {
  const ids = await readIndex(env, "ican:index:identity:" + identityId);
  const capabilities = [];

  for (const id of ids.slice(0, limit)) {
    const capability = await readCapability(env, id);

    if (!capability) continue;
    if (capability.identity_id !== identityId) continue;

    const item = cleanCapabilityForReturn(capability);

    const evidenceIds = await readIndex(env, "ican-evidence:index:ican:" + capability.id);
    item.evidence_count = evidenceIds.length;

    if (includeEvidence) {
      item.evidence = await readEvidenceForCapability(env, capability.id, identityId, limit);
    }

    capabilities.push(item);
  }

  return capabilities;
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

async function readIdentityEvidence(env, identityId, limit) {
  const ids = await readIndex(env, "ican-evidence:index:identity:" + identityId);
  const evidence = [];

  for (const id of ids.slice(0, limit)) {
    const item = await readEvidence(env, id);

    if (!item) continue;
    if (item.identity_id !== identityId) continue;

    evidence.push(cleanEvidenceForReturn(item));
  }

  return evidence;
}

async function readIdentityObjects(env, identityId, limit) {
  const ownerIds = await readIndex(env, "object:index:owner:" + identityId);
  const holderIds = await readIndex(env, "object:index:holder:" + identityId);

  const ids = Array.from(new Set([...ownerIds, ...holderIds])).slice(0, limit);
  const objects = [];

  for (const id of ids) {
    const object = await readObject(env, id);

    if (!object) continue;

    if (
      object.owner_identity_id !== identityId &&
      object.current_holder_identity_id !== identityId &&
      object.reserved_by_identity_id !== identityId &&
      object.fulfilled_by_identity_id !== identityId
    ) {
      continue;
    }

    objects.push(cleanObjectForReturn(object));
  }

  return objects;
}

async function readIdentityHandoffs(env, identityId, limit) {
  const fromIds = await readIndex(env, "object-handoff:index:from:" + identityId);
  const toIds = await readIndex(env, "object-handoff:index:to:" + identityId);
  const ownerIds = await readIndex(env, "object-handoff:index:owner:" + identityId);
  const claimantIds = await readIndex(env, "object-handoff:index:claimant:" + identityId);

  const ids = Array.from(new Set([...fromIds, ...toIds, ...ownerIds, ...claimantIds])).slice(0, limit);
  const handoffs = [];

  for (const id of ids) {
    const handoff = await readJsonKey(env, "object-handoff:" + id);

    if (!handoff) continue;
    if (!canReadHandoff(handoff, identityId)) continue;

    handoffs.push(cleanHandoffForReturn(handoff));
  }

  return handoffs;
}

async function readIdentityProofs(env, identityId, limit) {
  const actorIds = await readIndex(env, "handoff-proof:index:actor:" + identityId);
  const proofs = [];

  for (const id of actorIds.slice(0, limit)) {
    const proof = await readJsonKey(env, "handoff-proof:" + id);

    if (!proof) continue;
    if (!canReadProof(proof, identityId)) continue;

    proofs.push(cleanProofForReturn(proof));
  }

  return proofs;
}

function canReadHandoff(handoff, identityId) {
  return (
    handoff.owner_identity_id === identityId ||
    handoff.claimant_identity_id === identityId ||
    handoff.from_identity_id === identityId ||
    handoff.to_identity_id === identityId ||
    handoff.actor_identity_id === identityId
  );
}

function canReadProof(proof, identityId) {
  return (
    proof.owner_identity_id === identityId ||
    proof.claimant_identity_id === identityId ||
    proof.from_identity_id === identityId ||
    proof.to_identity_id === identityId ||
    proof.actor_identity_id === identityId
  );
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

async function readIdentity(env, identityId) {
  const id = cleanText(identityId);

  if (!id) return null;

  const raw =
    await env.IDENTITY.get("identity:" + id) ||
    await env.IDENTITY.get("user:" + id) ||
    await env.IDENTITY.get("idl:" + id);

  if (!raw) return null;

  try {
    return JSON.parse(raw);
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

async function readJsonKey(env, key) {
  const raw = await env.IDENTITY.get(key);

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

function cleanObjectForReturn(object) {
  return {
    id: object.id,
    handle: object.handle || null,
    owner_identity_id: object.owner_identity_id || null,
    current_holder_identity_id: object.current_holder_identity_id || null,
    previous_holder_identity_id: object.previous_holder_identity_id || null,
    reserved_by_identity_id: object.reserved_by_identity_id || null,
    fulfilled_by_identity_id: object.fulfilled_by_identity_id || null,
    title: object.title || null,
    type: object.type || null,
    status: object.status || null,
    description: object.description || null,
    tags: Array.isArray(object.tags) ? object.tags : [],
    image_url: object.image_url || null,
    url: object.url || null,
    created_at: object.created_at || null,
    updated_at: object.updated_at || null
  };
}

function cleanHandoffForReturn(handoff) {
  return {
    id: handoff.id,
    object_id: handoff.object_id,
    object_handle: handoff.object_handle || null,
    claim_id: handoff.claim_id,
    decision_id: handoff.decision_id || null,
    owner_identity_id: handoff.owner_identity_id,
    claimant_identity_id: handoff.claimant_identity_id,
    from_identity_id: handoff.from_identity_id,
    to_identity_id: handoff.to_identity_id,
    actor_identity_id: handoff.actor_identity_id,
    kind: handoff.kind,
    status: handoff.status,
    proof_id: handoff.proof_id || null,
    proof_status: handoff.proof_status || null,
    proof_shot_id: handoff.proof_shot_id || null,
    created_at: handoff.created_at || null,
    updated_at: handoff.updated_at || null
  };
}

function cleanProofForReturn(proof) {
  return {
    id: proof.id,
    handoff_id: proof.handoff_id,
    object_id: proof.object_id,
    object_handle: proof.object_handle || null,
    claim_id: proof.claim_id || null,
    owner_identity_id: proof.owner_identity_id || null,
    claimant_identity_id: proof.claimant_identity_id || null,
    from_identity_id: proof.from_identity_id || null,
    to_identity_id: proof.to_identity_id || null,
    actor_identity_id: proof.actor_identity_id || null,
    kind: proof.kind,
    status: proof.status,
    shot_id: proof.shot_id || null,
    evidence_id: proof.evidence_id || null,
    title: proof.title || null,
    note: proof.note || null,
    image_url: proof.image_url || null,
    url: proof.url || null,
    created_at: proof.created_at || null,
    updated_at: proof.updated_at || null
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
