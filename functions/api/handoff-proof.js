/**
 * functions/api/handoff-proof.js
 *
 * CyberCrowd Handoff Proof
 *
 * ONE JOB:
 * Attach proof to an object handoff.
 *
 * This is NOT payment.
 * This is NOT checkout.
 * This is NOT chat.
 * This does NOT create a PING.
 *
 * Object Handoff says:
 * custody moved.
 *
 * Handoff Proof says:
 * here is proof attached to that movement.
 *
 * Proof may be:
 * shot, note, image, receipt line, witness, object state,
 * service evidence, pickup evidence, return evidence,
 * or other CyberCrowd proof.
 */

const PROOF_TTL_SECONDS = 60 * 60 * 24 * 180;
const INDEX_TTL_SECONDS = 60 * 60 * 24 * 180;
const MAX_INDEX_ITEMS = 100;

const ALLOWED_PROOF_KIND = new Set([
  "shot",
  "image",
  "note",
  "receipt",
  "witness",
  "object_state",
  "pickup",
  "delivery",
  "return",
  "service",
  "other"
]);

const ALLOWED_STATUS = new Set([
  "attached",
  "review",
  "accepted",
  "rejected",
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

  const handoffId = cleanText(
    body.handoff_id ||
    body.handoffId ||
    body.id
  );

  if (!handoffId) {
    return json({
      ok: false,
      error: "HANDOFF_ID_REQUIRED"
    }, 400);
  }

  const handoff = await readHandoff(env, handoffId);

  if (!handoff) {
    return json({
      ok: false,
      error: "HANDOFF_NOT_FOUND"
    }, 404);
  }

  if (!canUseHandoff(handoff, actorIdentityId)) {
    return json({
      ok: false,
      error: "HANDOFF_PROOF_ACCESS_DENIED"
    }, 403);
  }

  const proofKind = normalizeProofKind(
    body.kind ||
    body.proof_kind ||
    body.proofKind ||
    "other"
  );

  if (!ALLOWED_PROOF_KIND.has(proofKind)) {
    return json({
      ok: false,
      error: "HANDOFF_PROOF_KIND_NOT_ALLOWED",
      allowed: Array.from(ALLOWED_PROOF_KIND)
    }, 400);
  }

  const status = cleanText(body.status || "attached").toLowerCase();

  if (!ALLOWED_STATUS.has(status)) {
    return json({
      ok: false,
      error: "HANDOFF_PROOF_STATUS_NOT_ALLOWED",
      allowed: Array.from(ALLOWED_STATUS)
    }, 400);
  }

  const proofId = cleanText(
    body.proof_id ||
    body.proofId
  ) || makeId("HANDOFF_PROOF");

  const shotId = cleanText(
    body.shot_id ||
    body.shotId ||
    body.proof_shot_id ||
    body.proofShotId
  );

  let shot = null;

  if (shotId) {
    shot = await readShot(env, shotId);

    if (!shot) {
      return json({
        ok: false,
        error: "SHOT_NOT_FOUND"
      }, 404);
    }
  }

  const now = new Date().toISOString();

  const proof = {
    id: proofId,

    handoff_id: handoff.id,
    object_id: handoff.object_id,
    object_handle: handoff.object_handle || null,
    claim_id: handoff.claim_id || null,

    owner_identity_id: handoff.owner_identity_id || null,
    claimant_identity_id: handoff.claimant_identity_id || null,
    from_identity_id: handoff.from_identity_id || null,
    to_identity_id: handoff.to_identity_id || null,
    actor_identity_id: actorIdentityId,

    kind: proofKind,
    status,

    shot_id: shot?.id || shotId || null,
    evidence_id: cleanText(body.evidence_id || body.evidenceId) || null,

    title: cleanText(body.title || body.name) || null,
    note: cleanText(body.note || body.message || body.description) || null,

    image_url: cleanText(
      body.image_url ||
      body.imageUrl ||
      shot?.image_url ||
      shot?.imageUrl
    ) || null,

    url: cleanText(
      body.url ||
      body.href ||
      body.link_url ||
      body.linkUrl
    ) || null,

    area: normalizeArea(body.area),

    created_at: now,
    updated_at: now,

    metadata: cleanMetadata(body.metadata)
  };

  await env.IDENTITY.put(
    "handoff-proof:" + proof.id,
    JSON.stringify(proof),
    {
      expirationTtl: PROOF_TTL_SECONDS
    }
  );

  await appendIndex(env, "handoff-proof:index:handoff:" + handoff.id, proof.id);
  await appendIndex(env, "handoff-proof:index:object:" + handoff.object_id, proof.id);
  await appendIndex(env, "handoff-proof:index:actor:" + actorIdentityId, proof.id);
  await appendIndex(env, "handoff-proof:index:kind:" + proof.kind, proof.id);
  await appendIndex(env, "handoff-proof:index:status:" + proof.status, proof.id);

  if (proof.shot_id) {
    await appendIndex(env, "handoff-proof:index:shot:" + proof.shot_id, proof.id);
  }

  if (proof.claim_id) {
    await appendIndex(env, "handoff-proof:index:claim:" + proof.claim_id, proof.id);
  }

  const updatedHandoff = {
    ...handoff,
    proof_id: proof.id,
    proof_status: proof.status,
    proof_kind: proof.kind,
    proof_shot_id: proof.shot_id || handoff.proof_shot_id || null,
    proof_attached_at: now,
    updated_at: now
  };

  await env.IDENTITY.put(
    "object-handoff:" + updatedHandoff.id,
    JSON.stringify(updatedHandoff),
    {
      expirationTtl: PROOF_TTL_SECONDS
    }
  );

  await appendSync(env, proof.id, {
    type: "handoff_proof_created",
    proof_id: proof.id,
    handoff_id: handoff.id,
    object_id: handoff.object_id,
    claim_id: handoff.claim_id || null,
    actor_identity_id: actorIdentityId,
    kind: proof.kind,
    status: proof.status,
    shot_id: proof.shot_id,
    at: now
  });

  await appendSync(env, handoff.id, {
    type: "handoff_proof_attached",
    proof_id: proof.id,
    handoff_id: handoff.id,
    object_id: handoff.object_id,
    claim_id: handoff.claim_id || null,
    actor_identity_id: actorIdentityId,
    kind: proof.kind,
    status: proof.status,
    shot_id: proof.shot_id,
    at: now
  });

  await appendSync(env, handoff.object_id, {
    type: "object_handoff_proof_attached",
    proof_id: proof.id,
    handoff_id: handoff.id,
    claim_id: handoff.claim_id || null,
    actor_identity_id: actorIdentityId,
    kind: proof.kind,
    status: proof.status,
    shot_id: proof.shot_id,
    at: now
  });

  if (handoff.claim_id) {
    await appendSync(env, handoff.claim_id, {
      type: "claim_handoff_proof_attached",
      proof_id: proof.id,
      handoff_id: handoff.id,
      object_id: handoff.object_id,
      actor_identity_id: actorIdentityId,
      kind: proof.kind,
      status: proof.status,
      at: now
    });
  }

  await appendSync(env, actorIdentityId, {
    type: "identity_attached_handoff_proof",
    proof_id: proof.id,
    handoff_id: handoff.id,
    object_id: handoff.object_id,
    claim_id: handoff.claim_id || null,
    kind: proof.kind,
    status: proof.status,
    shot_id: proof.shot_id,
    at: now
  });

  if (handoff.from_identity_id) {
    await appendSync(env, handoff.from_identity_id, {
      type: "handoff_proof_visible_to_from_identity",
      proof_id: proof.id,
      handoff_id: handoff.id,
      object_id: handoff.object_id,
      actor_identity_id: actorIdentityId,
      status: proof.status,
      at: now
    });
  }

  if (handoff.to_identity_id) {
    await appendSync(env, handoff.to_identity_id, {
      type: "handoff_proof_visible_to_to_identity",
      proof_id: proof.id,
      handoff_id: handoff.id,
      object_id: handoff.object_id,
      actor_identity_id: actorIdentityId,
      status: proof.status,
      at: now
    });
  }

  if (proof.shot_id) {
    await appendSync(env, proof.shot_id, {
      type: "shot_attached_as_handoff_proof",
      proof_id: proof.id,
      handoff_id: handoff.id,
      object_id: handoff.object_id,
      claim_id: handoff.claim_id || null,
      actor_identity_id: actorIdentityId,
      status: proof.status,
      at: now
    });
  }

  return json({
    ok: true,
    created: true,
    proof_id: proof.id,
    handoff_id: proof.handoff_id,
    object_id: proof.object_id,
    object_handle: proof.object_handle,
    claim_id: proof.claim_id,
    actor_identity_id: proof.actor_identity_id,
    kind: proof.kind,
    status: proof.status,
    shot_id: proof.shot_id,
    evidence_id: proof.evidence_id,
    ping_created: false,
    payment_created: false,
    next: {
      route: "/api/sync-trail",
      method: "GET",
      reason: "handoff_proof_attached"
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
    url.searchParams.get("proofId") ||
    url.searchParams.get("id")
  );

  if (proofId) {
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
        error: "HANDOFF_PROOF_ACCESS_DENIED"
      }, 403);
    }

    return json({
      ok: true,
      proof: cleanProofForReturn(proof),
      ping_created: false
    });
  }

  const handoffId = cleanText(
    url.searchParams.get("handoff_id") ||
    url.searchParams.get("handoffId")
  );

  if (!handoffId) {
    return json({
      ok: false,
      error: "HANDOFF_ID_REQUIRED"
    }, 400);
  }

  const handoff = await readHandoff(env, handoffId);

  if (!handoff) {
    return json({
      ok: false,
      error: "HANDOFF_NOT_FOUND"
    }, 404);
  }

  if (!canUseHandoff(handoff, identityId)) {
    return json({
      ok: false,
      error: "HANDOFF_ACCESS_DENIED"
    }, 403);
  }

  const ids = await readIndex(env, "handoff-proof:index:handoff:" + handoff.id);
  const proofs = [];

  for (const id of ids) {
    const proof = await readProof(env, id);

    if (!proof) continue;
    if (!canUseProof(proof, identityId)) continue;

    proofs.push(cleanProofForReturn(proof));
  }

  return json({
    ok: true,
    handoff_id: handoff.id,
    object_id: handoff.object_id,
    count: proofs.length,
    proofs,
    ping_created: false
  });
}

function canUseHandoff(handoff, identityId) {
  return (
    handoff.owner_identity_id === identityId ||
    handoff.claimant_identity_id === identityId ||
    handoff.from_identity_id === identityId ||
    handoff.to_identity_id === identityId ||
    handoff.actor_identity_id === identityId
  );
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
    area: proof.area || null,
    created_at: proof.created_at || null,
    updated_at: proof.updated_at || null
  };
}

function normalizeProofKind(value) {
  const clean = cleanText(value).toLowerCase();

  if (!clean) return "other";

  if (clean === "photo") return "image";
  if (clean === "picture") return "image";
  if (clean === "camera") return "shot";
  if (clean === "receipt_line") return "receipt";
  if (clean === "proof") return "other";
  if (clean === "pickup_proof") return "pickup";
  if (clean === "delivery_proof") return "delivery";

  return clean;
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
