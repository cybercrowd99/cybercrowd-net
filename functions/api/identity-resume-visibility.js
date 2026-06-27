/**
 * functions/api/identity-resume-visibility.js
 *
 * CyberCrowd Identity Resume Visibility
 *
 * ONE JOB:
 * Set whether an identity living resume is private, link-visible, invite-only, or open.
 *
 * This is NOT a profile.
 * This is NOT a resume form.
 * This is NOT search.
 * This is NOT chat.
 * This does NOT create a PING.
 *
 * Identity Resume says:
 * read identity through I CAN evidence.
 *
 * Resume Visibility says:
 * decide who can see that living resume.
 *
 * Identity remains evidence-based.
 * Profile form is not created.
 */

const IDENTITY_TTL_SECONDS = 60 * 60 * 24 * 365;
const INDEX_TTL_SECONDS = 60 * 60 * 24 * 365;
const MAX_INDEX_ITEMS = 100;

const ALLOWED_VISIBILITY = new Set([
  "private",
  "link",
  "invite",
  "open"
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

  const targetIdentityId = cleanText(
    body.identity_id ||
    body.identityId ||
    body.id ||
    identityId
  );

  if (targetIdentityId !== identityId) {
    return json({
      ok: false,
      error: "IDENTITY_VISIBILITY_ACCESS_DENIED"
    }, 403);
  }

  const visibility = normalizeVisibility(
    body.visibility ||
    body.mode ||
    "private"
  );

  if (!ALLOWED_VISIBILITY.has(visibility)) {
    return json({
      ok: false,
      error: "IDENTITY_RESUME_VISIBILITY_NOT_ALLOWED",
      allowed: Array.from(ALLOWED_VISIBILITY)
    }, 400);
  }

  const now = new Date().toISOString();

  const existingIdentity = await readIdentity(env, identityId);

  const shareId = cleanText(
    body.share_id ||
    body.shareId
  ) || existingIdentity?.resume_share_id || makeId("RESUME_SHARE");

  const identity = {
    ...(existingIdentity || {}),
    id: existingIdentity?.id || identityId,
    identity_id: identityId,

    resume_visibility: visibility,
    resume_visible_by_link: visibility === "link",
    resume_invite_only: visibility === "invite",
    public_resume: visibility === "open",
    resume_public: visibility === "open",

    resume_share_id: visibility === "link" ? shareId : existingIdentity?.resume_share_id || null,
    resume_visibility_note: cleanText(body.note || body.message || body.description) || null,

    updated_at: now,
    created_at: existingIdentity?.created_at || now
  };

  await env.IDENTITY.put(
    "identity:" + identityId,
    JSON.stringify(identity),
    {
      expirationTtl: IDENTITY_TTL_SECONDS
    }
  );

  await env.IDENTITY.put(
    "idl:" + identityId,
    JSON.stringify(identity),
    {
      expirationTtl: IDENTITY_TTL_SECONDS
    }
  );

  if (identity.email) {
    await env.IDENTITY.put(
      "user:" + identity.email,
      JSON.stringify(identity),
      {
        expirationTtl: IDENTITY_TTL_SECONDS
      }
    );
  }

  await appendIndex(env, "identity-resume-visibility:index:" + visibility, identityId);
  await appendIndex(env, "identity:index:resume-visibility:" + visibility, identityId);

  if (visibility === "link") {
    await env.IDENTITY.put(
      "identity-resume-share:" + shareId,
      JSON.stringify({
        id: shareId,
        identity_id: identityId,
        visibility,
        created_at: now,
        updated_at: now
      }),
      {
        expirationTtl: IDENTITY_TTL_SECONDS
      }
    );

    await appendIndex(env, "identity-resume-share:index:identity:" + identityId, shareId);
  }

  await appendSync(env, identityId, {
    type: "identity_resume_visibility_set",
    identity_id: identityId,
    visibility,
    resume_share_id: visibility === "link" ? shareId : null,
    actor_identity_id: identityId,
    at: now
  });

  return json({
    ok: true,
    updated: true,
    identity_id: identityId,
    resume_visibility: visibility,
    resume_visible_by_link: visibility === "link",
    resume_invite_only: visibility === "invite",
    public_resume: visibility === "open",
    resume_share_id: visibility === "link" ? shareId : null,
    ping_created: false,
    profile_created: false,
    resume_form_created: false,
    next: {
      route: "/api/identity-resume",
      method: "GET",
      reason: "resume_visibility_updated"
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

  const identity = await readIdentity(env, identityId);

  if (!identity) {
    return json({
      ok: true,
      identity_id: identityId,
      resume_visibility: "private",
      resume_visible_by_link: false,
      resume_invite_only: false,
      public_resume: false,
      resume_share_id: null,
      ping_created: false,
      profile_created: false,
      resume_form_created: false
    });
  }

  return json({
    ok: true,
    identity_id: identityId,
    resume_visibility: normalizeVisibility(identity.resume_visibility || "private"),
    resume_visible_by_link: identity.resume_visible_by_link === true,
    resume_invite_only: identity.resume_invite_only === true,
    public_resume: identity.public_resume === true || identity.resume_public === true,
    resume_share_id: identity.resume_share_id || null,
    updated_at: identity.updated_at || null,
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
    await env.IDENTITY.get("idl:" + id) ||
    await env.IDENTITY.get("user:" + id);

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
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

function normalizeVisibility(value) {
  const clean = cleanText(value).toLowerCase();

  if (!clean) return "private";

  if (clean === "closed") return "private";
  if (clean === "sealed") return "private";
  if (clean === "hidden") return "private";

  if (clean === "share") return "link";
  if (clean === "shared") return "link";
  if (clean === "share_link") return "link";
  if (clean === "link_visible") return "link";

  if (clean === "invited") return "invite";
  if (clean === "invite_only") return "invite";

  if (clean === "public") return "open";
  if (clean === "visible") return "open";

  return clean;
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
