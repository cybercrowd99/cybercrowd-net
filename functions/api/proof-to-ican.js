/**
 * functions/api/proof-to-ican.js
 *
 * CyberCrowd Proof To I CAN
 *
 * ONE JOB:
 * Turn accepted handoff proof into I CAN evidence.
 *
 * This is NOT a profile.
 * This is NOT a resume form.
 * This is NOT payment.
 * This is NOT checkout.
 * This does NOT create a PING.
 *
 * Handoff Proof says:
 * proof exists.
 *
 * Proof Decision says:
 * proof was accepted.
 *
 * Proof To I CAN says:
 * this accepted proof now supports what this identity can do.
 *
 * Identity is the living resume.
 * I CAN is capability.
 * Evidence is what proves it.
 */

const ICAN_TTL_SECONDS = 60 * 60 * 24 * 365;
const EVIDENCE_TTL_SECONDS = 60 * 60 * 24 * 365;
const INDEX_TTL_SECONDS = 60 * 60 * 24 * 365;
const MAX_INDEX_ITEMS = 100;

const ALLOWED_EVIDENCE_KIND = new Set([
  "handoff_proof",
  "shot",
  "object",
  "service",
  "job",
  "pickup",
  "delivery",
  "repair",
  "build",
  "sale",
  "teaching",
  "media",
  "reference",
  "work_record",
  "other"
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

  const proofId = cleanText(
    body.proof_id ||
    body.proofId ||
    body.handoff_proof_id ||
    body.handoffProofId
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
      error: "PROOF_TO_ICAN_ACCESS_DENIED"
    }, 403);
  }

  if (proof.status !== "accepted" && body.force !== true) {
    return json({
      ok: false,
      error: "PROOF_NOT_ACCEPTED",
      proof_status: proof.status,
      required: "accepted"
    }, 409);
  }

  const capabilityLabel = cleanText(
    body.capability ||
    body.ican ||
    body.label ||
    body.skill ||
    body.title ||
    proof.title ||
    "object handoff proof"
  );

  const capabilityId = cleanCapabilityId(
    body.ican_id ||
    body.icanId ||
    body.capability_id ||
    body.capabilityId ||
    makeCapabilityId(identityId, capabilityLabel)
  );

  if (!capabilityId) {
    return json({
      ok: false,
      error: "ICAN_ID_REQUIRED"
    }, 400);
  }

  const evidenceKind = normalizeEvidenceKind(
    body.kind ||
    body.evidence_kind ||
    body.evidenceKind ||
    proof.kind ||
    "handoff_proof"
  );

  if (!ALLOWED_EVIDENCE_KIND.has(evidenceKind)) {
    return json({
      ok: false,
      error: "ICAN_EVIDENCE_KIND_NOT_ALLOWED",
      allowed: Array.from(ALLOWED_EVIDENCE_KIND)
    }, 400);
  }

  const existingEvidenceId = await firstIndexValue(
    env,
    "ican-evidence:index:proof:" + proof.id + ":" + identityId
  );

  if (existingEvidenceId) {
    const existingEvidence = await readEvidence(env, existingEvidenceId);

    if (existingEvidence) {
      return json({
        ok: true,
        created: false,
        existing: true,
        evidence_id: existingEvidence.id,
        ican_id: existingEvidence.ican_id,
        identity_id: identityId,
        proof_id: proof.id,
        ping_created: false,
        reason: "proof_already_attached_to_ican"
      });
    }
  }

  const now = new Date().toISOString();

  const existingCapability = await readCapability(env, capabilityId);

  const capability = {
    ...(existingCapability || {}),
    id: capabilityId,
    identity_id: identityId,
    label: capabilityLabel,
    status: cleanText(body.status || existingCapability?.status || "active").toLowerCase(),
    source: existingCapability?.source || "proof_to_ican",
    description: cleanText(body.description || existingCapability?.description) || null,
    tags: mergeTags(existingCapability?.tags, body.tags),
    created_at: existingCapability?.created_at || now,
    updated_at: now
  };

  const evidenceId = cleanText(
    body.evidence_id ||
    body.evidenceId
  ) || makeId("ICAN_EVIDENCE");

  const evidence = {
    id: evidenceId,
    ican_id: capability.id,
    identity_id: identityId,

    kind: evidenceKind,
    status: "attached",

    proof_id: proof.id,
    handoff_id: proof.handoff_id || null,
    object_id: proof.object_id || null,
    object_handle: proof.object_handle || null,
    claim_id: proof.claim_id || null,
    shot_id: proof.shot_id || null,
    evidence_id: proof.evidence_id || null,

    owner_identity_id: proof.owner_identity_id || null,
    claimant_identity_id: proof.claimant_identity_id || null,
    from_identity_id: proof.from_identity_id || null,
    to_identity_id: proof.to_identity_id || null,

    title: cleanText(body.evidence_title || body.title || proof.title || capabilityLabel) || null,
    note: cleanText(body.note || body.message || proof.note) || null,

    image_url: cleanText(proof.image_url) || null,
    url: cleanText(proof.url) || null,

    created_at: now,
    updated_at: now,

    metadata: cleanMetadata(body.metadata)
  };

  await env.IDENTITY.put(
    "ican:" + capability.id,
    JSON.stringify(capability),
    {
      expirationTtl: ICAN_TTL_SECONDS
    }
  );

  await env.IDENTITY.put(
    "ican-evidence:" + evidence.id,
    JSON.stringify(evidence),
    {
      expirationTtl: EVIDENCE_TTL_SECONDS
    }
  );

  await appendIndex(env, "ican:index:identity:" + identityId, capability.id);
  await appendIndex(env, "ican:index:status:" + capability.status, capability.id);
  await appendIndex(env, "ican-evidence:index:ican:" + capability.id, evidence.id);
  await appendIndex(env, "ican-evidence:index:identity:" + identityId, evidence.id);
  await appendIndex(env, "ican-evidence:index:kind:" + evidence.kind, evidence.id);
  await appendIndex(env, "ican-evidence:index:proof:" + proof.id + ":" + identityId, evidence.id);

  if (evidence.object_id) {
    await appendIndex(env, "ican-evidence:index:object:" + evidence.object_id, evidence.id);
  }

  if (evidence.handoff_id) {
    await appendIndex(env, "ican-evidence:index:handoff:" + evidence.handoff_id, evidence.id);
  }

  if (evidence.claim_id) {
    await appendIndex(env, "ican-evidence:index:claim:" + evidence.claim_id, evidence.id);
  }

  if (evidence.shot_id) {
    await appendIndex(env, "ican-evidence:index:shot:" + evidence.shot_id, evidence.id);
  }

  await appendSync(env, identityId, {
    type: "identity_ican_evidence_attached_from_proof",
    ican_id: capability.id,
    evidence_id: evidence.id,
    proof_id: proof.id,
    handoff_id: evidence.handoff_id,
    object_id: evidence.object_id,
    claim_id: evidence.claim_id,
    shot_id: evidence.shot_id,
    capability: capability.label,
    kind: evidence.kind,
    at: now
  });

  await appendSync(env, capability.id, {
    type: "ican_evidence_attached",
    ican_id: capability.id,
    identity_id: identityId,
    evidence_id: evidence.id,
    proof_id: proof.id,
    handoff_id: evidence.handoff_id,
    object_id: evidence.object_id,
    capability: capability.label,
    at: now
  });

  await appendSync(env, evidence.id, {
    type: "ican_evidence_created_from_handoff_proof",
    evidence_id: evidence.id,
    ican_id: capability.id,
    identity_id: identityId,
    proof_id: proof.id,
    handoff_id: evidence.handoff_id,
    object_id: evidence.object_id,
    claim_id: evidence.claim_id,
    shot_id: evidence.shot_id,
    at: now
  });

  await appendSync(env, proof.id, {
    type: "handoff_proof_attached_to_ican",
    proof_id: proof.id,
    ican_id: capability.id,
    evidence_id: evidence.id,
    identity_id: identityId,
    capability: capability.label,
    at: now
  });

  if (evidence.handoff_id) {
    await appendSync(env, evidence.handoff_id, {
      type: "handoff_proof_became_ican_evidence",
      handoff_id: evidence.handoff_id,
      proof_id: proof.id,
      ican_id: capability.id,
      evidence_id: evidence.id,
      identity_id: identityId,
      capability: capability.label,
      at: now
    });
  }

  if (evidence.object_id) {
    await appendSync(env, evidence.object_id, {
      type: "object_proof_became_ican_evidence",
      object_id: evidence.object_id,
      proof_id: proof.id,
      ican_id: capability.id,
      evidence_id: evidence.id,
      identity_id: identityId,
      capability: capability.label,
      at: now
    });
  }

  if (evidence.shot_id) {
    await appendSync(env, evidence.shot_id, {
      type: "shot_became_ican_evidence",
      shot_id: evidence.shot_id,
      proof_id: proof.id,
      ican_id: capability.id,
      evidence_id: evidence.id,
      identity_id: identityId,
      capability: capability.label,
      at: now
    });
  }

  return json({
    ok: true,
    created: true,
    ican_id: capability.id,
    evidence_id: evidence.id,
    identity_id: identityId,
    capability: capability.label,
    proof_id: proof.id,
    handoff_id: evidence.handoff_id,
    object_id: evidence.object_id,
    claim_id: evidence.claim_id,
    shot_id: evidence.shot_id,
    kind: evidence.kind,
    status: evidence.status,
    ping_created: false,
    profile_created: false,
    resume_form_created: false,
    next: {
      route: "/api/sync-trail",
      method: "GET",
      reason: "proof_attached_to_ican"
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
      error: "PROOF_TO_ICAN_ACCESS_DENIED"
    }, 403);
  }

  const ids = await readIndex(env, "ican-evidence:index:proof:" + proof.id + ":" + identityId);
  const evidence = [];

  for (const id of ids) {
    const item = await readEvidence(env, id);

    if (!item) continue;
    if (item.identity_id !== identityId) continue;

    evidence.push(cleanEvidenceForReturn(item));
  }

  return json({
    ok: true,
    proof_id: proof.id,
    identity_id: identityId,
    count: evidence.length,
    evidence,
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

async function firstIndexValue(env, key) {
  const list = await readIndex(env, key);
  return list[0] || "";
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
    title: evidence.title || null,
    note: evidence.note || null,
    image_url: evidence.image_url || null,
    url: evidence.url || null,
    created_at: evidence.created_at || null,
    updated_at: evidence.updated_at || null
  };
}

function normalizeEvidenceKind(value) {
  const clean = cleanText(value).toLowerCase();

  if (!clean) return "handoff_proof";

  if (clean === "proof") return "handoff_proof";
  if (clean === "photo") return "shot";
  if (clean === "image") return "shot";
  if (clean === "pickup_proof") return "pickup";
  if (clean === "delivery_proof") return "delivery";
  if (clean === "repair_proof") return "repair";
  if (clean === "build_proof") return "build";

  return clean;
}

function makeCapabilityId(identityId, label) {
  const base = cleanSlug(label || "capability");

  return "ICAN." + cleanSlug(identityId).slice(0, 32) + "." + base;
}

function cleanCapabilityId(value) {
  const clean = cleanText(value);

  if (!clean) return "";

  return clean
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9._:-]/g, "")
    .slice(0, 140);
}

function cleanSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80) || "item";
}

function mergeTags(existing, incoming) {
  const list = [];

  if (Array.isArray(existing)) {
    list.push(...existing);
  }

  if (Array.isArray(incoming)) {
    list.push(...incoming);
  } else if (typeof incoming === "string") {
    list.push(...incoming.split(/[\s,]+/));
  }

  return Array.from(
    new Set(
      list
        .map((item) => String(item).trim().toLowerCase())
        .filter(Boolean)
    )
  ).slice(0, 25);
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
