export async function createVerificationToken(env, email) {
  const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, "0")).join("");
  const key = `verify:${token}`;

  await env.VERIFY_KV.put(key, email, { expirationTtl: 900 });

  return token;
}

export async function consumeVerificationToken(env, token) {
  const key = `verify:${token}`;
  const email = await env.VERIFY_KV.get(key, { cacheTtl: 30 });

  if (!email) {
    return { ok: false, reason: "invalid_or_expired" };
  }

  const conn = env.HYPERDRIVE_DB.connect();
  await conn.execute(
    "UPDATE users SET verified = 1 WHERE email = ?",
    [email]
  );
  await conn.close();

  await env.VERIFY_KV.delete(key);

  return { ok: true, email };
}
