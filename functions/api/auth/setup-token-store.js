// CyberCrowd Setup Token Store – KV Helper
// Owns: writing, reading, deleting setup:<token> records.
// Does NOT own: token creation, email sending, verification, password hashing, session, cookie.

export async function storeSetupToken(env, key, record) {
  await env.IDENTITY.put(key, JSON.stringify(record), {
    expiration: Math.floor(record.expiresAt / 1000)
  });
}

export async function readSetupToken(env, key) {
  const raw = await env.IDENTITY.get(key);
  return raw ? JSON.parse(raw) : null;
}

export async function deleteSetupToken(env, key) {
  await env.IDENTITY.delete(key);
}
