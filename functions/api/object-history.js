/**
 * functions/api/object-history.js
 *
 * CyberCrowd Object History
 *
 * ONE JOB:
 * Read the full object history across handle, claim, handoff, proof, and SYNC.
 *
 * This is NOT search.
 * This is NOT chat.
 * This is NOT notification spam.
 * This does NOT create a PING.
 *
 * Object History means:
 * the object story can be read from one place.
 *
 * Handle says:
 * the object exists.
 *
 * Claim says:
 * someone requested movement.
 *
 * Decision says:
 * the owner decided.
 *
 * Handoff says:
 * custody moved.
 *
 * Proof says:
 * evidence was attached.
 *
 * SYNC says:
 * continuity is preserved.
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

  const objectId = cleanText(
    url.searchParams.get("object_id") ||
    url.searchParams.get("objectId") ||
    url.searchParams.get("id")
  );

  const objectHandle = cleanHandle(
    url.searchParams.get("object_handle") ||
    url.searchParams.get("objectHandle") ||
    url.searchParams.get("handle")
  );

  const limit = clampLimit(url.searchParams.get("limit"));
  const includeSync = url.searchParams.get("include_sync") !== "false";

  const object = await resolveObject(env, {
    objectId,
    objectHandle
  });

  if (!object) {
    return json({
      ok: false,
      error: "OBJECT_NOT_FOUND"
    }, 404);
  }

  if (!canReadObject(object, viewerIdentityId)) {
    return json({
      ok: false,
      error: "OBJECT_HISTORY_ACCESS_DENIED"
    }, 403);
  }

  const claims = await readClaims(env, object.id, viewerIdentityId, limit);
  const handoffs = await readHandoffs(env, object.id, viewerIdentityId, limit);
  const proofs = await readProofs(env, object.id, viewerIdentityId, limit);
  const relevanceChecks = await readRelevanceChecks(env, object.id, viewerIdentityId, limit);
  const pings = await readPings(env, object.id, viewerIdentityId, limit);

  const sync = includeSync
    ? await readSync(env, object.id, limit)
    : [];

  return json({
    ok: true,
    viewer_identity_id: viewerIdentityId,
    object: cleanObjectForReturn(object),
    counts: {
      claims: claims.length,
      handoffs: handoffs.length,
      proofs: proofs.length,
      relevance_checks: relevanceChecks.length,
      pings: pings.length,
      sync: sync.length
    },
    claims,
    handoffs,
    proofs,
    relevance_checks: relevanceChecks,
    pings,
    sync,
    ping_created: false
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

  const object = await resolveObject(env, {
    objectId: cleanText(body.object_id || body.objectId || body.id),
    objectHandle: cleanHandle(body.object_handle || body.objectHandle || body.handle)
  });

  if (!object) {
    return json({
      ok: false,
      error: "OBJECT_NOT_FOUND"
    }, 404);
  }

  if (!canReadObject(object, viewerIdentityId)) {
    return json({
      ok: false,
      error: "OBJECT_HISTORY_ACCESS_DENIED"
    }, 403);
  }

  const limit = clampLimit(body.limit);
  const includeSync = body.include_sync !== false;

  const claims = await readClaims(env, object.id, viewerIdentityId, limit);
  const handoffs = await readHandoffs(env, object.id, viewerIdentityId, limit);
  const proofs = await readProofs(env, object.id, viewerIdentityId, limit);
  const relevanceChecks = await readRelevanceChecks(env, object.id, viewerIdentityId, limit);
  const pings = await readPings(env, object.id, viewerIdentityId, limit);

  const sync = includeSync
    ? await readSync(env, object.id, limit)
    : [];

  return json({
    ok: true,
    viewer_identity_id: viewerIdentityId,
    object: cleanObjectForReturn(object),
    counts: {
      claims: claims.length,
      handoffs: handoffs.length,
      proofs: proofs.length,
      relevance_checks: relevanceChecks.length,
      pings: pings.length,
      sync: sync.length
    },
    claims,
    handoffs,
    proofs,
    relevance_checks: relevanceChecks,
    pings,
    sync,
    ping_created: false
  });
}

async function resolveObject(env, input) {
  const objectId = cleanText(input.objectId);
  const objectHandle = cleanHandle(input.objectHandle);

  if (objectId) {
    const object = await readObject(env, objectId);

    if (object) {
      return object;
    }
  }

  if (objectHandle) {
    const resolvedId = await resolveObjectHandle(env, objectHandle);

    if (resolvedId) {
      return await readObject(env, resolvedId);
    }
  }

  return null;
}

function canReadObject(object, identityId) {
  if (!object) return false;

  if (object.public === true) return true;
  if (object.owner_identity_id === identityId) return true;
  if (object.current_holder_identity_id === identityId) return true;
  if (object.reserved_by_identity_id === identityId) return true;
  if (object.fulfilled_by_identity_id === identityId) return true;

  return false;
}

async function readClaims(env, objectId, identityId, limit) {
  const ids = await readIndex(env, "object-claim:index:object:" + objectId);
  const claims = [];

  for (const id of ids.slice(0, limit)) {
    const claim = await readJsonKey(env, "object-claim:" + id);

    if (!claim) continue;

    if (claim.owner_identity_id !== identityId && claim.claimant_identity_id !== identityId) {
      continue;
    }

    claims.push(cleanClaimForReturn(claim));
  }

  return claims;
}

async function readHandoffs(env, objectId, identityId, limit) {
  const ids = await readIndex(env, "object-handoff:index:object:" + objectId);
  const handoffs = [];

  for (const id of ids.slice(0, limit)) {
    const handoff = await readJsonKey(env, "object-handoff:" + id);

    if (!handoff) continue;

    if (!canReadHandoff(handoff, identityId)) {
      continue;
    }

    handoffs.push(cleanHandoffForReturn(handoff));
  }

  return handoffs;
}

async function readProofs(env, objectId, identityId, limit) {
  const ids = await readIndex(env, "handoff-proof:index:object:" + objectId);
  const proofs = [];

  for (const id of ids.slice(0, limit)) {
    const proof = await readJsonKey(env, "handoff-proof:" + id);

    if (!proof) continue;

    if (!canReadProof(proof, identityId)) {
      continue;
    }

    proofs.push(cleanProofForReturn(proof));
  }

  return proofs;
}

async function readRelevanceChecks(env, objectId, identityId, limit) {
  const ids = await readIndex(env, "relevance:index:object:" + objectId);
  const checks = [];

  for (const id of ids.slice(0, limit)) {
    const relevance = await readJsonKey(env, "relevance:" + id);

    if (!relevance) continue;

    if (relevance.identity_id !== identityId) {
      continue;
    }

    checks.push(cleanRelevanceForReturn(relevance));
  }

  return checks;
}

async function readPings(env, objectId, identityId, limit) {
  const ids = await readIndex(env, "ping:index:object:" + objectId);
  const pings = [];

  for (const id of ids.slice(0, limit)) {
    const ping = await readJsonKey(env, "ping:" + id);

    if (!ping) continue;

    if (ping.to_identity_id !== identityId && ping.from_identity_id !== identityId) {
      continue;
    }

    pings.push(cleanPingForReturn(ping));
  }

  return pings;
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

function cleanObjectForReturn(object) {
  return {
    id: object.id,
    handle: object.handle || null,
    owner_identity_id: object.owner_identity_id || null,
    current_holder_identity_id: object.current_holder_identity_id || null,
    previous_holder_identity_id: object.previous_holder_identity_id || null,
    reserved_by_identity_id: object.reserved_by_identity_id || null,
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

function cleanClaimForReturn(claim) {
  return {
    id: claim.id,
    object_id: claim.object_id,
    object_handle: claim.object_handle || null,
    owner_identity_id: claim.owner_identity_id,
    claimant_identity_id: claim.claimant_identity_id,
    kind: claim.kind,
    status: claim.status,
    ping_id: claim.ping_id || null,
    relevance_id: claim.relevance_id || null,
    intent_id: claim.intent_id || null,
    field_id: claim.field_id || null,
    proximity_id: claim.proximity_id || null,
    title: claim.title || null,
    note: claim.note || null,
    created_at: claim.created_at || null,
    updated_at: claim.updated_at || null
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

function cleanRelevanceForReturn(relevance) {
  return {
    id: relevance.id,
    identity_id: relevance.identity_id,
    result: relevance.result,
    relevant: relevance.relevant === true,
    score: Number(relevance.score || 0),
    reason: relevance.reason || null,
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

function cleanPingForReturn(ping) {
  return {
    id: ping.id,
    kind: ping.kind,
    status: ping.status,
    from_identity_id: ping.from_identity_id,
    to_identity_id: ping.to_identity_id,
    relevance_id: ping.relevance_id || null,
    object_id: ping.object_id || null,
    object_handle: ping.object_handle || null,
    shot_id: ping.shot_id || null,
    intent_id: ping.intent_id || null,
    field_id: ping.field_id || null,
    proximity_id: ping.proximity_id || null,
    title: ping.title || null,
    message: ping.message || null,
    surface: ping.surface || null,
    carrier: ping.carrier || null,
    created_at: ping.created_at || null,
    updated_at: ping.updated_at || null
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
    owner_identity_id: cleanText(event.owner_identity_id || event.ownerIdentityId) || null,
    claimant_identity_id: cleanText(event.claimant_identity_id || event.claimantIdentityId) || null,
    actor_identity_id: cleanText(event.actor_identity_id || event.actorIdentityId) || null,

    object_id: cleanText(event.object_id || event.objectId) || null,
    object_handle: cleanText(event.object_handle || event.objectHandle) || null,

    claim_id: cleanText(event.claim_id || event.claimId) || null,
    decision_id: cleanText(event.decision_id || event.decisionId) || null,
    handoff_id: cleanText(event.handoff_id || event.handoffId) || null,
    proof_id: cleanText(event.proof_id || event.proofId) || null,

    ping_id: cleanText(event.ping_id || event.pingId) || null,
    relevance_id: cleanText(event.relevance_id || event.relevanceId) || null,
    intent_id: cleanText(event.intent_id || event.intentId) || null,
    field_id: cleanText(event.field_id || event.fieldId) || null,
    shot_id: cleanText(event.shot_id || event.shotId) || null,

    action: cleanText(event.action) || null,
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

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}
