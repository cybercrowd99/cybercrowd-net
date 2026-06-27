/**
 * functions/api/identity-resume-share.js
 *
 * CyberCrowd Identity Resume Share
 *
 * ONE JOB:
 * Read a link-visible living resume through its share handle.
 *
 * This is NOT a profile.
 * This is NOT a resume form.
 * This is NOT search.
 * This is NOT chat.
 * This does NOT create a PING.
 *
 * Resume Visibility says:
 * this identity may be visible by link.
 *
 * Resume Share says:
 * this share handle may read the living resume.
 *
 * Identity remains evidence-based.
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

  const url = new URL(request.url);

  const shareId = cleanText(
    url.searchParams.get("share_id") ||
    url.searchParams.get("shareId") ||
    url.searchParams.get("id")
  );

  if (!shareId) {
    return json({
      ok: false,
      error: "RESUME_SHARE_ID_REQUIRED"
    }, 400);
  }

  const limit = clampLimit(url.searchParams.get("limit"));
  const includeEvidence = url.searchParams.get("include_evidence") !== "false";
  const includeSync = url.searchParams.get("include_sync") === "true";

  const share = await readShare(env, shareId);

  if (!share) {
    return json({
      ok: false,
      error: "RESUME_SHARE_NOT_FOUND"
    }, 404);
  }

  const identityId = cleanText(share.identity_id || share.identityId);

  if (!identityId) {
    return json({
      ok: false,
      error: "RESUME_SHARE_IDENTITY_MISSING"
    }, 500);
  }

  const identity = await readIdentity(env, identityId);

  if (!identity) {
    return json({
      ok: false,
      error: "IDENTITY_NOT_FOUND"
    }, 404);
  }

  const visibility = normalizeVisibility(identity.resume_visibility || share.visibility || "private");

  if (visibility !== "link" && visibility !== "open") {
    return json({
      ok: false,
      error: "RESUME_SHARE_NOT_VISIBLE",
      resume_visibility: visibility
    }, 403);
  }

  if (visibility === "link" && identity.resume_share_id !== shareId) {
    return json({
      ok: false,
      error: "RESUME_SHARE_HANDLE_MISMATCH"
    }, 403);
  }

  const capabilities = await readCapabilities(env, identityId, limit, includeEvidence);
  const evidence = await readIdentityEvidence(env, identityId, limit);

  const sync = includeSync
    ? await readPublicSync(env, identityId, limit)
    : [];

  return json({
    ok: true,
    share_id: shareId,
    identity_id: identityId,
    resume_visibility: visibility,

    living_resume: {
      identity_id: identityId,
      capability_count: capabilities.length,
      evidence_count: evidence.length
    },

    capabilities,
    evidence,
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

  const body = await readJson(request);

  if (!body) {
    return json({
      ok: false,
      error: "JSON_REQUIRED"
    }, 400);
  }

  const shareId = cleanText(
    body.share_id ||
    body.shareId ||
    body.id
  );

  if (!shareId) {
    return json({
      ok: false,
      error: "RESUME_SHARE_ID_REQUIRED"
    }, 400);
  }

  const limit = clampLimit(body.limit);
  const includeEvidence = body.include_evidence !== false;
  const includeSync = body.include_sync === true;

  const share = await readShare(env, shareId);

  if (!share) {
    return json({
      ok: false,
      error: "RESUME_SHARE_NOT_FOUND"
    }, 404);
  }

  const identityId = cleanText(share.identity_id || share.identityId);

  if (!identityId) {
    return json({
      ok: false,
      error: "RESUME_SHARE_IDENTITY_MISSING"
    }, 500);
  }

  const identity = await readIdentity(env, identityId);

  if (!identity) {
    return json({
      ok: false,
      error: "IDENTITY_NOT_FOUND"
    }, 404);
  }

  const visibility = normalizeVisibility(identity.resume_visibility || share.visibility || "private");

  if (visibility !== "link" && visibility !== "open") {
    return json({
      ok: false,
      error: "RESUME_SHARE_NOT_VISIBLE",
      resume_visibility: visibility
    }, 403);
  }

  if (visibility === "link" && identity.resume_share_id !== shareId) {
    return json({
      ok: false,
      error: "RESUME_SHARE_HANDLE_MISMATCH"
    }, 403);
  }

  const capabilities = await readCapabilities(env, identityId, limit, includeEvidence);
  const evidence = await readIdentityEvidence(env, identityId, limit);

  const sync = includeSync
    ? await readPublicSync(env, identityId, limit)
    : [];

  return json({
    ok: true,
    share_id: shareId,
    identity_id: identityId,
    resume_visibility: visibility,

    living_resume: {
      identity_id: identityId,
      capability_count: capabilities.length,
      evidence_count: evidence.length
    },

    capabilities,
    evidence,
    sync,

    ping_created: false,
    profile_created: false,
    resume_form_created: false
  });
}

async function readCapabilities(env, identityId, limit, includeEvidence) {
  const ids = await readIndex(env, "ican:index:identity:" + identityId);
  const capabilities = [];

  for (const id of ids.slice(0, limit)) {
    const capability = await readCapability(env, id);

    if (!capability) continue;
    if (capability.identity_id !== identityId) continue;
    if (capability.status && capability.status !== "active") continue;

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
    if (item.status && item.status !== "attached" && item.status !== "accepted") continue;

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
    if (item.status && item.status !== "attached" && item.status !== "accepted") continue;

    evidence.push(cleanEvidenceForReturn(item));
  }

  return evidence;
}

async function readShare(env, shareId) {
  const id = cleanText(shareId);

  if (!id) return null;

  const raw = await env.IDENTITY.get("identity-resume-share:" + id);

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function readIdentity(env, identityId) {
  const id = cleanText(identityId);

  if (!id) return null;

  const raw =
    await env.IDENTITY.get("identity:" + id) ||
    await env.IDENTITY.get("idl:" + id) ||
    await env.IDENTITY.get("user:" + id);

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

async function readPublicSync(env, targetId, limit) {
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

async function readJson(request) {
  try {
    return await request.json();
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

    ican_id: cleanText(event.ican_id || event.icanId) || null,
    evidence_id: cleanText(event.evidence_id || event.evidenceId) || null,
    proof_id: cleanText(event.proof_id || event.proofId) || null,
    handoff_id: cleanText(event.handoff_id || event.handoffId) || null,
    object_id: cleanText(event.object_id || event.objectId) || null,
    claim_id: cleanText(event.claim_id || event.claimId) || null,
    shot_id: cleanText(event.shot_id || event.shotId) || null,

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

function normalizeVisibility(value) {
  const clean = cleanText(value).toLowerCase();

  if (!clean) return "private";

  if (clean === "public") return "open";
  if (clean === "visible") return "open";
  if (clean === "share") return "link";
  if (clean === "shared") return "link";
  if (clean === "share_link") return "link";
  if (clean === "link_visible") return "link";
  if (clean === "invite_only") return "invite";
  if (clean === "closed") return "private";
  if (clean === "sealed") return "private";
  if (clean === "hidden") return "private";

  return clean;
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
