async function hmacSign(message, secret) {
  const enc = new TextEncoder();

  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));

  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session_id");

  if (!sessionId) {
    return Response.json({ error: "missing_session_id" }, { status: 400 });
  }

  const stripeResponse = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${sessionId}`,
    {
      headers: {
        "Authorization": `Bearer ${env.STRIPE_SECRET_KEY}`
      }
    }
  );

  const session = await stripeResponse.json();

  if (!stripeResponse.ok) {
    return Response.json(session, { status: 500 });
  }

  if (session.payment_status !== "paid") {
    return Response.json({
      error: "payment_not_complete",
      payment_status: session.payment_status
    }, { status: 402 });
  }

  const nodeId = session.metadata?.node_id || "unknown-node";

  const payload = {
    license_id: crypto.randomUUID(),
    product: "wdig_surface_os_license",
    node_id: nodeId,
    stripe_session_id: sessionId,
    issued_at: Math.floor(Date.now() / 1000),
    mode: "full"
  };

  const payload64 = btoa(JSON.stringify(payload))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");

  const signature = await hmacSign(payload64, env.LICENSE_SIGNING_SECRET);

  const licenseToken = `${payload64}.${signature}`;

  return Response.json({
    status: "licensed",
    license_token: licenseToken,
    payload
  });
}
