export async function onRequest(context) {
  const request = context.request;
  const cookieHeader = request.headers.get("Cookie") || "";

  const cookies = Object.fromEntries(
    cookieHeader.split(";").map(v => {
      const [k, ...rest] = v.trim().split("=");
      return [k, rest.join("=")];
    })
  );

  const token = cookies["cc_access"];
  const secret = context.env.CC_SESSION_SECRET || "";

  if (!token || !secret) {
    return new Response(JSON.stringify({ authenticated: false }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response(JSON.stringify({ authenticated: true }), {
    headers: { "Content-Type": "application/json" }
  });
}
