export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function userKey(identityOrEmail) {
  return `user:${String(identityOrEmail || "").trim()}`;
}

export function userEmailKey(email) {
  return `user-email:${normalizeEmail(email)}`;
}

export function setupKey(token) {
  return `setup:${String(token || "").trim()}`;
}

export function sessionKey(eat) {
  return `session:${String(eat || "").trim()}`;
}

export async function getSetupRecord(env, token) {
  if (!env.IDENTITY) {
    throw new Error("identity_kv_missing");
  }

  const raw = await env.IDENTITY.get(setupKey(token));

  if (!raw) {
    return null;
  }

  return JSON.parse(raw);
}

export async function deleteSetupRecord(env, token) {
  if (!env.IDENTITY) {
    throw new Error("identity_kv_missing");
  }

  await env.IDENTITY.delete(setupKey(token));
}

export async function saveUserRecord(env, identityActiveId, record) {
  if (!env.IDENTITY) {
    throw new Error("identity_kv_missing");
  }

  const email = normalizeEmail(record?.email);
  const cleanIdentityActiveId = String(identityActiveId || record?.["identity-active-id"] || "").trim();

  if (!cleanIdentityActiveId) {
    throw new Error("identity_active_id_missing");
  }

  const userRecord = {
    ...record,
    "identity-active-id": cleanIdentityActiveId,
    email
  };

  await env.IDENTITY.put(
    userKey(cleanIdentityActiveId),
    JSON.stringify(userRecord)
  );

  if (email) {
    await env.IDENTITY.put(userEmailKey(email), cleanIdentityActiveId);
  }
}

export async function getUserRecord(env, identityOrEmail) {
  if (!env.IDENTITY) {
    throw new Error("identity_kv_missing");
  }

  const lookup = String(identityOrEmail || "").trim();

  if (!lookup) {
    return null;
  }

  const directRaw = await env.IDENTITY.get(userKey(lookup));

  if (directRaw) {
    return JSON.parse(directRaw);
  }

  const email = normalizeEmail(lookup);

  if (email && email.includes("@")) {
    const identityActiveId = await env.IDENTITY.get(userEmailKey(email));

    if (!identityActiveId) {
      return null;
    }

    const userRaw = await env.IDENTITY.get(userKey(identityActiveId));

    if (!userRaw) {
      return null;
    }

    return JSON.parse(userRaw);
  }

  return null;
}

export async function saveSessionRecord(env, eat, record, ttlSeconds = 86400 * 7) {
  if (!env.IDENTITY) {
    throw new Error("identity_kv_missing");
  }

  await env.IDENTITY.put(
    sessionKey(eat),
    JSON.stringify(record),
    {
      expirationTtl: ttlSeconds
    }
  );
}

export async function getSessionRecord(env, eat) {
  if (!env.IDENTITY) {
    throw new Error("identity_kv_missing");
  }

  const raw = await env.IDENTITY.get(sessionKey(eat));

  if (!raw) {
    return null;
  }

  return JSON.parse(raw);
}
