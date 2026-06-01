export async function onRequest(context) {
  const request = context.request;
  const env = context.env;
  const secret = env.CC_SESSION_SECRET || "";

  // Read the Supabase session from the request
  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "");

  if (!token || !secret) {
    return new Response(JSON.stringify({ error: "no identity token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Build the cc_access cookie value: base64url(payload).base64url(signature)
  const payload = {
    sub: "",        // fill from Supabase user ID
    email: "",      // fill from Supabase email
    tier: "free",
    iat: Date.now(),
    exp: Date.now() + 86400000, // 24 hours
  };

  // Sign with HMAC using CC_SESSION_SECRET
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const payloadB64 = btoa(JSON.stringify(payload))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payloadB64));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const ccAccess = `${payloadB64}.${sigB64}`;

  return new Response(JSON.stringify({ authenticated: true }), {
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": `cc_access=${ccAccess}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`
    }
  });
}
