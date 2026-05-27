export async function onRequestPost({ request, env }) {
  const { userId, password } = await request.json();

  if (!userId || !password) {
    return new Response(JSON.stringify({ error: "missing_fields" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const email = await env.USERS.get(`user:${userId}:email`);
  if (!email) {
    return new Response(JSON.stringify({ error: "invalid_user" }), {
      status: 400,
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

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
