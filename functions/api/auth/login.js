export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const email = body.email;
    const password = body.password;

    // BASIC INPUT CHECK
    if (!email || !password) {
      return new Response(JSON.stringify({ error: "missing fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // LOOK UP USER ID BY EMAIL
    const userId = await env.USERS.get(`email:${email}`);
    if (!userId) {
      return new Response(JSON.stringify({ error: "invalid credentials" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // GET STORED HASH
    const storedHash = await env.USERS.get(`user:${userId}:password`);
    if (!storedHash) {
      return new Response(JSON.stringify({ error: "no password set" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // HASH PROVIDED PASSWORD
    const hashBuffer = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(password)
    );

    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedPassword = hashArray
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

    // COMPARE HASHES
    if (hashedPassword !== storedHash) {
      return new Response(JSON.stringify({ error: "invalid credentials" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // CREATE NEW SESSION TOKEN
    const sessionToken = crypto.randomUUID();

    // STORE SESSION
    await env.SESSION.put(sessionToken, userId, {
      expirationTtl: 60 * 60 * 24 * 7 // 7 days
    });

    return new Response(JSON.stringify({
      ok: true,
      sessionToken,
      userId
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: "server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
