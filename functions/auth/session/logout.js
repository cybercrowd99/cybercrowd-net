export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const cookie = request.headers.get("Cookie") || "";
    const sessionToken = parseCookie(cookie, "session");

    if (sessionToken) {
      const sessionKey = `session:${sessionToken}`;
      await env.IDENTITY.delete(sessionKey);
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": `session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`
      }
    });
  }
};

function parseCookie(cookie, name) {
  const parts = cookie.split(";").map((c) => c.trim());
  for (const part of parts) {
    if (part.startsWith(name + "=")) {
      return part.substring(name.length + 1);
    }
  }
  return null;
}
