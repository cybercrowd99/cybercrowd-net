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

  await env.DB.prepare("UPDATE users SET verified = 1 WHERE email = ?").bind(email).run();

  await env.VERIFY_KV.delete(key);

  return { ok: true, email };
}
