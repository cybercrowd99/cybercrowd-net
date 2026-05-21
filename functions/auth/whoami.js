export async function onRequest(context) {
  const request = context.request;
  const env = context.env;

  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map(v => {
      const [k, ...rest] = v.trim().split("=");
      return [k, rest.join("=")];
    })
  );

  const token = cookies["cc_access"];
  const secret = env.CC_SESSION_SECRET || "";

  if (!token || !secret) {
    return new Response(JSON.stringify({ authenticated: false, session: null }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return new Response(JSON.stringify({ authenticated: false, session: null }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const payloadJson = atob(parts[0].replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(payloadJson);

    return new Response(JSON.stringify({ authenticated: true, session: payload }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch {
    return new Response(JSON.stringify({ authenticated: false, session: null }), {
      headers: { "Content-Type": "application/json" }
    });
  }
}
