async function handleSetPassword(request, env, corsHeaders) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400, corsHeaders);
  }

  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";
  const setupToken = body.setupToken || "";
  const turnstileToken = body.turnstileToken || "";

  if (!email || !password || !setupToken || !turnstileToken) {
    return json(
      { error: "Missing email, password, setup token, or Turnstile token" },
      400,
      corsHeaders
    );
  }

  if (password.length < 8) {
    return json({ error: "Password must be at least 8 characters" }, 400, corsHeaders);
  }

  /* 1. Turnstile validates human
     If Turnstile fails → no EAT.
  */
  const turnstile = await verifyTurnstile(turnstileToken, ip, env);
  if (!turnstile?.success) {
    return json({ error: "Turnstile verification failed" }, 403, corsHeaders);
  }

  /* 2. Setup token validates authority
     If setup token fails → no EAT.
  */
  const setupKey = `setup:${setupToken}`;
  const storedEmail = await env.IDENTITY.get(setupKey);

  if (!storedEmail || storedEmail.toLowerCase() !== email) {
    return json({ error: "Invalid or expired setup token" }, 403, corsHeaders);
  }

  /* 3. Password hashing seals the epoch
     This is the lock moment.
  */
  const passwordHash = await hashPassword(password, email);
  const now = Date.now();

  const userKey = `user:${email}`;
  const existing = (await env.USERS.get(userKey, { type: "json" })) || {};

  await env.USERS.put(
    userKey,
    JSON.stringify({
      ...existing,
      email,
      verified: true,
      createdAt: existing.createdAt || now,
      passwordHash,
      passwordSetAt: now,
      passwordEpoch: now,
    })
  );

  // Consume setup authority after the password is sealed.
  await env.IDENTITY.delete(setupKey);

  /* 4. Session token is minted
     This is the EAT.
  */
  const session = mintSession(email);

  /* 5. EAT is stored in KV
     This is the group band assignment.
  */
  await env.IDENTITY.put(
    `session:${session.eat}`,
    JSON.stringify(session),
    { expirationTtl: 86400 * 7 }
  );

  /* 6. Cookie is set
     This is the hive entry.
  */
  return json(
    {
      ok: true,
      email,
      band: session.band,
    },
    200,
    {
      ...corsHeaders,
      "Set-Cookie": `session=${session.eat}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800`,
    }
  );
}
