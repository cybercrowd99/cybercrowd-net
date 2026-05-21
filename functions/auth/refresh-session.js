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
    return new Response(JSON.stringify({ refreshed: false }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return new Response(JSON.stringify({ refreshed: false }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  let payload;
  try {
    const payloadJson = atob(parts[0].replace(/-/g, "+").replace(/_/g, "/"));
    payload = JSON.parse(payloadJson);
  } catch {
    return new Response(JSON.stringify({ refreshed: false }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  const now = Math.floor(Date.now() / 1000);
  const newExp = now + 60 * 60; // 1 hour

  const newPayload = JSON.stringify({
    ...payload,
    exp: newExp
  });

  const payloadPart = btoa(newPayload)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payloadPart)
  );

  const signaturePart = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const newToken = `${payloadPart}.${signaturePart}`;

  return new Response(JSON.stringify({ refreshed: true }), {
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": `cc_access=${newToken}; Path=/; HttpOnly; Secure; SameSite=Lax`
    }
  });
}
