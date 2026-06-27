/**
 * functions/api/resume-invite.js
 *
 * CyberCrowd Resume Invite
 *
 * ONE JOB:
 * Invite one identity to view a private or invite-only living resume.
 *
 * This is NOT a profile.
 * This is NOT a resume form.
 * This is NOT chat.
 * This is NOT email.
 * This does NOT create a PING.
 *
 * Resume Visibility says:
 * private / link / invite / open.
 *
 * Resume Invite says:
 * this one viewer identity may read the living resume.
 */

const INVITE_TTL_SECONDS = 60 * 60 * 24 * 30;
const INDEX_TTL_SECONDS = 60 * 60 * 24 * 365;
const MAX_INDEX_ITEMS = 100;

const ALLOWED_STATUS = new Set([
  "active",
  "revoked",
  "expired",
  "archived"
]);

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env || !env.IDENTITY) {
    return json({ ok: false, error: "IDENTITY_KV_MISSING" }, 500);
  }

  const session = await readVerifiedSession(request, env);

  if (!session) {
    return json({ ok: false, error: "SESSION_REQUIRED" }, 401);
  }

  const ownerIdentityId = cleanText(
    session.identity_id ||
    session.identityId ||
    session.idl ||
    session.email
  );

  if (!ownerIdentityId) {
    return json({ ok: false, error: "SESSION_IDENTITY_MISSING" }, 401);
  }

  const body = await readJson(request);

  if (!body) {
    return json({ ok: false, error: "JSON_REQUIRED" }, 400);
  }

  const viewerIdentityId = cleanText(
    body.viewer_identity_id ||
    body.viewerIdentityId ||
    body.to_identity_id ||
    body.toIdentityId ||
    body.viewer
  );

  if (!viewerIdentityId) {
    return json({ ok: false, error: "VIEWER_IDENTITY_REQUIRED" }, 400);
  }

  if (viewerIdentityId === ownerIdentityId) {
    return json({
      ok: false,
      error: "SELF_INVITE_NOT_REQUIRED"
    }, 400);
  }

  const status = cleanText(body.status || "active").toLowerCase();

  if (!ALLOWED_STATUS.has(status)) {
    return json({
      ok: false,
      error: "RESUME_INVITE_STATUS_NOT_ALLOWED",
      allowed: Array.from(ALLOWED_STATUS)
    }, 400);
  }

  const now = new Date().toISOString();

  const inviteId = cleanText(
    body.invite_id ||
    body.inviteId ||
    body.id
  ) || makeId("RESUME_INVITE");

  const existingInviteId = await firstIndexValue(
    env,
    "resume-invite:index:pair:" + ownerIdentityId + ":" + viewerIdentityId
  );

  if (existingInviteId) {
    const existing = await readInvite(env, existingInviteId);

    if (existing && existing.status === "active") {
      return json({
        ok: true,
        created: false,
        existing: true,
        invite_id: existing.id,
        owner_identity_id: ownerIdentityId,
        viewer_identity_id: viewerIdentityId,
        status: existing.status,
        ping_created: false,
        profile_created: false,
        resume_form_created: false
      });
    }
  }

  const invite = {
    id: inviteId,
    owner_identity_id: ownerIdentityId,
    viewer_identity_id: viewerIdentityId,

    status,
    scope: "living_resume",

    note: cleanText(body.note || body.message || body.description) || null,

    created_at: now,
    updated_at: now,
    expires_at: cleanText(body.expires_at || body.expiresAt) || null,

    metadata: cleanMetadata(body.metadata)
  };

  await env.IDENTITY.put(
    "resume-invite:" + invite.id,
    JSON.stringify(invite),
    { expirationTtl: INVITE_TTL_SECONDS }
  );

  await appendIndex(env, "resume-invite:index:owner:" + ownerIdentityId, invite.id);
  await appendIndex(env, "resume-invite:index:viewer:" + viewerIdentityId, invite.id);
  await appendIndex(env, "resume-invite:index:status:" + status, invite.id);
  await appendIndex(env, "resume-invite:index:pair:" + ownerIdentityId + ":" + viewerIdentityId, invite.id);

  await appendSync(env, ownerIdentityId, {
    type: "identity_resume_invite_created",
    invite_id: invite.id,
    owner_identity_id: ownerIdentityId,
    viewer_identity_id: viewerIdentityId,
    status: invite.status,
    at: now
  });

  await appendSync(env, viewerIdentityId, {
    type: "identity_resume_invite_received",
    invite_id: invite.id,
    owner_identity_id: ownerIdentityId,
    viewer_identity_id: viewerIdentityId,
    status: invite.status,
    at: now
  });

  await appendSync(env, invite.id, {
    type: "resume_invite_recorded",
    invite_id: invite.id,
    owner_identity_id: ownerIdentityId,
    viewer_identity_id: viewerIdentityId,
    status: invite.status,
    at: now
  });

  return json({
    ok: true,
    created: true,
    invite_id: invite.id,
    owner_identity_id: ownerIdentityId,
    viewer_identity_id: viewerIdentityId,
    status: invite.status,
    scope: invite.scope,
    ping_created: false,
    profile_created: false,
    resume_form_created: false,
    next: {
      route: "/api/identity-resume",
      method: "GET",
      reason: "viewer_invited_to_living_resume"
    }
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;

  if (!env || !env.IDENTITY) {
    return json({ ok: false, error: "IDENTITY_KV_MISSING" }, 500);
  }

  const session = await readVerifiedSession(request, env);

  if (!session) {
    return json({ ok: false, error: "SESSION_REQUIRED" }, 401);
  }

  const identityId = cleanText(
    session.identity_id ||
    session.identityId ||
    session.idl ||
    session.email
  );

  if (!identityId) {
    return json({ ok: false, error: "SESSION_IDENTITY_MISSING" }, 401);
  }

  const url = new URL(request.url);

  const inviteId = cleanText(
    url.searchParams.get("invite_id") ||
    url.searchParams.get("inviteId") ||
    url.searchParams.get("id")
  );

  if (inviteId) {
    const invite = await readInvite(env, inviteId);

    if (!invite) {
      return json({ ok: false, error: "RESUME_INVITE_NOT_FOUND" }, 404);
    }

    if (invite.owner_identity_id !== identityId && invite.viewer_identity_id !== identityId) {
      return json({ ok: false, error: "RESUME_INVITE_ACCESS_DENIED" }, 403);
    }

    return json({
      ok: true,
      invite: cleanInviteForReturn(invite),
      ping_created: false
    });
  }

  const role = cleanText(url.searchParams.get("role") || "owner").toLowerCase();

  const key = role === "viewer"
    ? "resume-invite:index:viewer:" + identityId
    : "resume-invite:index:owner:" + identityId;

  const ids = await readIndex(env, key);
  const invites = [];

  for (const id of ids) {
    const invite = await readInvite(env, id);

    if (!invite) continue;
    if (invite.owner_identity_id !== identityId && invite.viewer_identity_id !== identityId) continue;

    invites.push(cleanInviteForReturn(invite));
  }

  return json({
    ok: true,
    identity_id: identityId,
    role,
    count: invites.length,
    invites,
    ping_created: false,
    profile_created: false,
    resume_form_created: false
  });
}

export async function onRequestPatch(context) {
  const { request, env } = context;

  if (!env || !env.IDENTITY) {
    return json({ ok: false, error: "IDENTITY_KV_MISSING" }, 500);
  }

  const session = await readVerifiedSession(request, env);

  if (!session) {
    return json({ ok: false, error: "SESSION_REQUIRED" }, 401);
  }

  const actorIdentityId = cleanText(
    session.identity_id ||
    session.identityId ||
    session.idl ||
    session.email
  );

  if (!actorIdentityId) {
    return json({ ok: false, error: "SESSION_IDENTITY_MISSING" }, 401);
  }

  const body = await readJson(request);

  if (!body) {
    return json({ ok: false, error: "JSON_REQUIRED" }, 400);
  }

  const inviteId = cleanText(
    body.invite_id ||
    body.inviteId ||
    body.id
  );

  if (!inviteId) {
    return json({ ok: false, error: "RESUME_INVITE_ID_REQUIRED" }, 400);
  }

  const invite = await readInvite(env, inviteId);

  if (!invite) {
    return json({ ok: false, error: "RESUME_INVITE_NOT_FOUND" }, 404);
  }

  if (invite.owner_identity_id !== actorIdentityId) {
    return json({ ok: false, error: "RESUME_INVITE_OWNER_REQUIRED" }, 403);
  }

  const status = cleanText(body.status || "revoked").toLowerCase();

  if (!ALLOWED_STATUS.has(status)) {
    return json({
      ok: false,
      error: "RESUME_INVITE_STATUS_NOT_ALLOWED",
      allowed: Array.from(ALLOWED_STATUS)
    }, 400);
  }

  const now = new Date().toISOString();

  const updated = {
    ...invite,
    status,
    updated_at: now,
    revoked_at: status === "revoked" ? now : invite.revoked_at || null
  };

  await env.IDENTITY.put(
    "resume-invite:" + updated.id,
    JSON.stringify(updated),
    { expirationTtl: INVITE_TTL_SECONDS }
  );

  await appendIndex(env, "resume-invite:index:status:" + status, updated.id);

  await appendSync(env, updated.owner_identity_id, {
    type: "identity_resume_invite_updated",
    invite_id: updated.id,
    viewer_identity_id: updated.viewer_identity_id,
    status: updated.status,
    at: now
  });

  await appendSync(env, updated.viewer_identity_id, {
    type: "identity_resume_invite_status_changed",
    invite_id: updated.id,
    owner_identity_id: updated.owner_identity_id,
    status: updated.status,
    at: now
  });

  return json({
    ok: true,
    updated: true,
    invite: cleanInviteForReturn(updated),
    ping_created: false,
    profile_created: false,
    resume_form_created: false
  });
}

async function readVerifiedSession(request, env) {
  const token =
    getCookie(request, "session") ||
    getCookie(request, "cc_session") ||
    getBearerToken(request);

  if (!token) return null;

  const raw = await env.IDENTITY.get("session:" + token);

  if (!raw) return null;

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

async function readInvite(env, inviteId) {
  const id = cleanText(inviteId);

  if (!id) return null;

  const raw = await env.IDENTITY.get("resume-invite:" + id);

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
    return Array.isArray(parsed)
      ? parsed.filter((item) => typeof item === "string" && item.trim())
      : [];
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
      if (Array.isArray(parsed)) list = parsed;
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
    { expirationTtl: INDEX_TTL_SECONDS }
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
      if (Array.isArray(parsed)) trail = parsed;
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
    { expirationTtl: INDEX_TTL_SECONDS }
  );
}

function cleanInviteForReturn(invite) {
  return {
    id: invite.id,
    owner_identity_id: invite.owner_identity_id,
    viewer_identity_id: invite.viewer_identity_id,
    status: invite.status,
    scope: invite.scope || "living_resume",
    note: invite.note || null,
    created_at: invite.created_at || null,
    updated_at: invite.updated_at || null,
    expires_at: invite.expires_at || null,
    revoked_at: invite.revoked_at || null
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

  if (!match) return "";

  return match[1].trim();
}

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanMetadata(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

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
