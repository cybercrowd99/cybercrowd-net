export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const password = body.password;

    if (!password || password.length < 6) {
      return new Response(JSON.stringify({ error: "invalid password" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const sessionToken = request.headers.get("Authorization");
    if (!sessionToken) {
      return new Response(JSON.stringify({ error: "no session" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    const userId = await env.SESSION.get(sessionToken);
    if (!userId) {
      return new Response(JSON.stringify({ error: "invalid session" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    const hashBuffer = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(password)
    );

    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedPassword = hashArray
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

    await env.USERS.put(`user:${userId}:password`, hashedPassword);
    await env.USERS.put(`user:${userId}:verified`, "true");

    return new Response(JSON.stringify({ ok: true }), {
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
