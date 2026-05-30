export async function onRequest({ request, env }) {
  try {
    const body = await request.json();
    const email = body.email;

    if (!email) {
      return new Response(JSON.stringify({ error: "missing email" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const db = env.DB;

    const existing = await db
      .prepare("SELECT id FROM users WHERE email = ?")
      .bind(email)
      .first();

    if (existing) {
      return new Response(JSON.stringify({ userId: existing.id }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    const id = crypto.randomUUID();
    const createdAt = Date.now();

    await db
      .prepare(
        "INSERT INTO users (id, email, password, createdAt) VALUES (?, ?, ?, ?)"
      )
      .bind(id, email, null, createdAt)
      .run();

    return new Response(JSON.stringify({ userId: id }), {
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
