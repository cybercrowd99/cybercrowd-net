export async function onRequestPost({ request, env }) {
  const { ip, action } = await request.json();

  if (!ip || !action) {
    return new Response(JSON.stringify({ error: "missing_fields" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  if (action === "block") {
    await env.SAFETY.put(`block:ip:${ip}`, "1", { expirationTtl: 86400 });
    return new Response(JSON.stringify({ ok: true, status: "blocked" }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }

  if (action === "unblock") {
    await env.SAFETY.delete(`block:ip:${ip}`);
    return new Response(JSON.stringify({ ok: true, status: "unblocked" }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response(JSON.stringify({ error: "invalid_action" }), {
    status: 400,
    headers: { "Content-Type": "application/json" }
  });
}
