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

  if (!token) {
    return new Response(JSON.stringify({ hasToken: false, hash: null }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return new Response(JSON.stringify({ hasToken: false, hash: null }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  const payloadPart = parts[0];

  try {
    const data = new TextEncoder().encode(payloadPart);
    const digest = await crypto.subtle.digest("SHA-256", data);
    const bytes = Array.from(new Uint8Array(digest));

    return new Response(JSON.stringify({ hasToken: true, hash: bytes }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch {
    return new Response(JSON.stringify({ hasToken: false, hash: null }), {
      headers: { "Content-Type": "application/json" }
    });
  }
}
 
