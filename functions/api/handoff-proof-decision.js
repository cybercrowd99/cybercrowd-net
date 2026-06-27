/**
 * functions/api/handoff-proof-decision.js
 *
 * CyberCrowd Handoff Proof Decision
 *
 * ONE JOB:
 * Accept, reject, or archive proof attached to an object handoff.
 *
 * This is NOT payment.
 * This is NOT checkout.
 * This is NOT chat.
 * This does NOT create a PING.
 *
 * Handoff Proof says:
 * proof was attached to custody movement.
 *
 * Handoff Proof Decision says:
 * the proof was accepted, rejected, moved to review, or archived.
 */

const PROOF_TTL_SECONDS = 60 * 60 * 24 * 180;
const HANDOFF_TTL_SECONDS = 60 * 60 * 24 * 180;
const INDEX_TTL_SECONDS = 60 * 60 * 24 * 180;
const MAX_INDEX_ITEMS = 100;

const ALLOWED_DECISIONS = new Set([
  "accept",
  "reject",
  "review",
  "archive",
  "reopen"
]);

const PROOF_STATUS_BY_DECISION = {
  accept: "accepted",
  reject: "rejected",
  review: "review",
  archive: "archived",
  reopen: "attached"
};

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

  const actorIdentityId = cleanText(
    session.identity_id ||
    session.identityId ||
    session.idl ||
    session.email
  );

  if (!actorIdentityId) {
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

  const proofId = cleanText(
    body.proof_id ||
    body.proofId ||
    body.id
  );

  if (!proofId) {
    return json({
      ok: false,
      error: "PROOF_ID_REQUIRED"
    }, 400);
  }

  const proof = await readProof(env, proofId);

  if (!proof) {
    return json({
      ok: false,
      error: "HANDOFF_PROOF_NOT_FOUND"
    }, 404);
  }

  if (!canUseProof(proof, actorIdentityId)) {
    return json({
      ok: false,
      error: "HANDOFF_PROOF_DECISION_ACCESS_DENIED"
    }, 403);
  }

  const decision = cleanText(
    body.decision ||
    body.action ||
    "accept"
  ).toLowerCase();

  if (!ALLOWED_DECISIONS.has(decision)) {
    return json({
      ok: false,
      error: "HANDOFF_PROOF_DECISION_NOT_ALLOWED",
      allowed: Array.from(ALLOWED_DECISIONS)
    }, 400);
  }

  const nextStatus = PROOF_STATUS_BY_DECISION[decision];
  const previousStatus = proof.status || "attached";
  const now = new Date().toISOString();

  const decisionId = cleanText(
    body.decision_id ||
    body.decisionId
  ) || makeId("HANDOFF_PROOF_DECISION");

  const decisionRecord = {
    id: decisionId,

    proof_id: proof.id,
    handoff_id: proof.handoff_id,
    object_id: proof.object_id,
    claim_id: proof.claim_id || null,

    owner_identity_id: proof.owner_identity_id || null,
    claimant_identity_id: proof.claimant_identity_id || null,
    from_identity_id: proof.from_identity_id || null,
    to_identity_id: proof.to_identity_id || null,
    actor_identity_id: actorIdentityId,

    decision,
    previous_status: previousStatus,
    next_status: nextStatus,

    note: cleanText(body.note || body.message || body.description) || null,

    shot_id: proof.shot_id || null,
    evidence_id: proof.evidence_id || null,

    created_at: now,
    updated_at: now,

    metadata: cleanMetadata(body.metadata)
  };

  const updatedProof = {
    ...proof,
    status: nextStatus,
    decision,
    decision_id: decisionRecord.id,
    decided_by_identity_id: actorIdentityId,
    decided_at: now,
    decision_note: decisionRecord.note,
    updated_at: now
  };

  await env.IDENTITY.put(
    "handoff-proof:" + updatedProof.id,
    JSON.stringify(updatedProof),
    {
      expirationTtl: PROOF_TTL_SECONDS
    }
  );

  await env.IDENTITY.put(
    "handoff-proof-decision:" + decisionRecord.id,
    JSON.stringify(decisionRecord),
    {
      expirationTtl: PROOF_TTL_SECONDS
    }
  );

  await appendIndex(env, "handoff-proof-decision:index:proof:" + proof.id, decisionRecord.id);
  await appendIndex(env, "handoff-proof-decision:index:handoff:" + proof.handoff_id, decisionRecord.id);
  await appendIndex(env, "handoff-proof-decision:index:object:" + proof.object_id, decisionRecord.id);
  await appendIndex(env, "handoff-proof-decision:index:actor:" + actorIdentityId, decisionRecord.id);
  await appendIndex(env, "handoff-proof-decision:index:decision:" + decision, decisionRecord.id);
  await appendIndex(env, "handoff-proof:index:status:" + nextStatus, proof.id);

  const handoff = await readHandoff(env, proof.handoff_id);

  if (handoff) {
    const updatedHandoff = {
      ...handoff,
      proof_status: nextStatus,
      proof_decision_id: decisionRecord.id,
      proof_decided_at: now,
      updated_at: now
    };

    await env.IDENTITY.put(
      "object-handoff:" + updatedHandoff.id,
      JSON.stringify(updatedHandoff),
      {
        expirationTtl: HANDOFF_TTL_SECONDS
      }
    );
  }

  await appendSync(env, decisionRecord.id, {
    type: "handoff_proof_decision_recorded",
    decision_id: decisionRecord.id,
    proof_id: proof.id,
    handoff_id: proof.handoff_id,
    object_id: proof.object_id,
    decision,
    previous_status: previousStatus,
    next_status: nextStatus,
    actor_identity_id: actorIdentityId,
    at: now
  });

  await appendSync(env, proof.id, {
    type: "handoff_proof_decided",
    decision_id: decisionRecord.id,
    proof_id: proof.id,
    handoff_id: proof.handoff_id,
    object_id: proof.object_id,
    decision,
    previous_status: previousStatus,
    next_status: nextStatus,
    actor_identity_id: actorIdentityId,
    at: now
  });

  await appendSync(env, proof.handoff_id, {
    type: "handoff_proof_decision_applied",
    decision_id: decisionRecord.id,
    proof_id: proof.id,
    handoff_id: proof.handoff_id,
    object_id: proof.object_id,
    decision,
    next_status: nextStatus,
    actor_identity_id: actorIdentityId,
    at: now
  });

  await appendSync(env, proof.object_id, {
    type: "object_handoff_proof_decided",
    decision_id: decisionRecord.id,
    proof_id: proof.id,
    handoff_id: proof.handoff_id,
    decision,
    next_status: nextStatus,
    actor_identity_id: actorIdentityId,
    at: now
  });

  if (proof.claim_id) {
    await appendSync(env, proof.claim_id, {
      type: "claim_handoff_proof_decided",
      decision_id: decisionRecord.id,
      proof_id: proof.id,
      handoff_id: proof.handoff_id,
      object_id: proof.object_id,
      decision,
      next_status: nextStatus,
      actor_identity_id: actorIdentityId,
      at: now
    });
  }

  if (proof.shot_id) {
    await appendSync(env, proof.shot_id, {
      type: "shot_handoff_proof_decided",
      decision_id: decisionRecord.id,
      proof_id: proof.id,
      handoff_id: proof.handoff_id,
      object_id: proof.object_id,
      decision,
      next_status: nextStatus,
      actor_identity_id: actorIdentityId,
      at: now
    });
  }

  await appendSync(env, actorIdentityId, {
    type: "identity_decided_handoff_proof",
    decision_id: decisionRecord.id,
    proof_id: proof.id,
    handoff_id: proof.handoff_id,
    object_id: proof.object_id,
    decision,
    next_status: nextStatus,
    at: now
  });

  return json({
    ok: true,
    created: true,
    decision_id: decisionRecord.id,
    proof_id: proof.id,
    handoff_id: proof.handoff_id,
    object_id: proof.object_id,
    claim_id: proof.claim_id || null,
    actor_identity_id: actorIdentityId,
    decision,
    previous_status: previousStatus,
    next_status: nextStatus,
    ping_created: false,
    payment_created: false,
    next: {
      route: "/api/sync-trail",
      method: "GET",
      reason: "handoff_proof_decision_recorded"
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

  const proofId = cleanText(
    url.searchParams.get("proof_id") ||
    url.searchParams.get("proofId")
  );

  if (!proofId) {
    return json({
      ok: false,
      error: "PROOF_ID_REQUIRED"
    }, 400);
  }

  const proof = await readProof(env, proofId);

  if (!proof) {
    return json({
      ok: false,
      error: "HANDOFF_PROOF_NOT_FOUND"
    }, 404);
  }

  if (!canUseProof(proof, identityId)) {
    return json({
      ok: false,
      error: "HANDOFF_PROOF_DECISION_ACCESS_DENIED"
    }, 403);
  }

  const ids = await readIndex(env, "handoff-proof-decision:index:proof:" + proof.id);
  const decisions = [];

  for (const id of ids) {
    const decision = await readDecision(env, id);

    if (!decision) continue;

    decisions.push(cleanDecisionForReturn(decision));
  }

  return json({
    ok: true,
    proof_id: proof.id,
    handoff_id: proof.handoff_id,
    object_id: proof.object_id,
    count: decisions.length,
    decisions,
    ping_created: false
  });
}

function canUseProof(proof, identityId) {
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

async function readProof(env, proofId) {
  const id = cleanText(proofId);

  if (!id) return null;

  const raw = await env.IDENTITY.get("handoff-proof:" + id);

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function readHandoff(env, handoffId) {
  const id = cleanText(handoffId);

  if (!id) return null;

  const raw = await env.IDENTITY.get("object-handoff:" + id);

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function readDecision(env, decisionId) {
  const id = cleanText(decisionId);

  if (!id) return null;

  const raw = await env.IDENTITY.get("handoff-proof-decision:" + id);

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

function cleanDecisionForReturn(decision) {
  return {
    id: decision.id,
    proof_id: decision.proof_id,
    handoff_id: decision.handoff_id,
    object_id: decision.object_id,
    claim_id: decision.claim_id || null,
    owner_identity_id: decision.owner_identity_id || null,
    claimant_identity_id: decision.claimant_identity_id || null,
    from_identity_id: decision.from_identity_id || null,
    to_identity_id: decision.to_identity_id || null,
    actor_identity_id: decision.actor_identity_id,
    decision: decision.decision,
    previous_status: decision.previous_status,
    next_status: decision.next_status,
    note: decision.note || null,
    shot_id: decision.shot_id || null,
    evidence_id: decision.evidence_id || null,
    created_at: decision.created_at || null,
    updated_at: decision.updated_at || null
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
