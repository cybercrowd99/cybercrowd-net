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
    return new Response(JSON.stringify({ hasToken: false, signature: null }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return new Response(JSON.stringify({ hasToken: false, signature: null }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  const signaturePart = parts[1];

  try {
    const raw = atob(signaturePart.replace(/-/g, "+").replace(/_/g, "/"));
    const bytes = Array.from(raw).map(c => c.charCodeAt(0));

    return new Response(JSON.stringify({ hasToken: true, signature: bytes }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch {
    return new Response(JSON.stringify({ hasToken: false, signature: null }), {
      headers: { "Content-Type": "application/json" }
    });
  }
}
 
