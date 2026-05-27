export async function onRequest(context) {
    const request = context.request;
    const env = context.env;

    const auth = request.headers.get("Authorization") || "";
    const token = auth.replace("Bearer ", "").trim();

    if (!token) {
        return new Response(JSON.stringify({ valid: false }), {
            status: 401,
            headers: { "Content-Type": "application/json" }
        });
    }

    // Reuse your existing token validation worker
    const verify = await env.AUTH_TOKEN_VERIFY.fetch(request, {
        method: "POST",
        body: JSON.stringify({ token })
    });

    if (!verify.ok) {
        return new Response(JSON.stringify({ valid: false }), {
            status: 401,
            headers: { "Content-Type": "application/json" }
        });
    }

    const data = await verify.json();

    return new Response(JSON.stringify({ valid: data.valid === true }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
    });
}
