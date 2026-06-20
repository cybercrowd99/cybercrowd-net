export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function userKey(email) {
  return `user:${normalizeEmail(email)}`;
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

export async function saveUserRecord(env, email, record) {
  if (!env.IDENTITY) {
    throw new Error("identity_kv_missing");
  }

  await env.IDENTITY.put(
    userKey(email),
    JSON.stringify({
      ...record,
      email: normalizeEmail(email)
    })
  );
}

export async function getUserRecord(env, email) {
  if (!env.IDENTITY) {
    throw new Error("identity_kv_missing");
  }

  const raw = await env.IDENTITY.get(userKey(email));

  if (!raw) {
    return null;
  }

  return JSON.parse(raw);
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
