export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const text = body.text || "";

    // sovereign assistant backend call
    const reply = await env.SOVEREIGN_ASSISTANT.generate(text);

    return new Response(JSON.stringify({ reply }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ reply: "Assistant error." }), {
      headers: { "Content-Type": "application/json" },
      status: 500
    });
  }
}
