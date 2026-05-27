export async function onRequest(context) {
    const request = context.request;
    const env = context.env;

    const auth = request.headers.get("Authorization") || "";
    const token = auth.replace("Bearer ", "").trim();

    if (!token) {
        return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    }

    // Delete session from KV
    const key = `SESSION:${token}`;
    await env.SESSION.delete(key);

    return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store"
        }
    });
}
