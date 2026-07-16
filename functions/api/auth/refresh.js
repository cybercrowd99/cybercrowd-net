export async function onRequest(context) {
  const CC_SESSION_SECRET = process.env.CC_SESSION_SECRET;
  const req = context.request;

  const token =
    req.headers.get("authorization") ||
    req.headers.get("x-session-token") ||
    null;

  if (!token) {
    return new Response(JSON.stringify({
      refreshed: false,
      reason: "missing_token"
    }, null, 2), {
      headers: { "Content-Type": "application/json" }
    });
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return new Response(JSON.stringify({
      refreshed: false,
      reason: "malformed_token"
    }, null, 2), {
      headers: { "Content-Type": "application/json" }
    });
  }

  const [payload, signatureHex] = parts;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(CC_SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const expectedBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );

  const expectedArray = Array.from(new Uint8Array(expectedBuffer));
  const expectedHex = expectedArray.map(b => b.toString(16).padStart(2, "0")).join("");

  if (expectedHex !== signatureHex) {
    return new Response(JSON.stringify({
      refreshed: false,
      reason: "signature_mismatch"
    }, null, 2), {
      headers: { "Content-Type": "application/json" }
    });
  }

  const now = Date.now();
  const newWindow = Math.floor(now / (15 * 60 * 1000));
  const newPayload = `cc_session|${newWindow}`;

  const newSigBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(newPayload)
  );

  const newSigArray = Array.from(new Uint8Array(newSigBuffer));
  const newSigHex = newSigArray.map(b => b.toString(16).padStart(2, "0")).join("");

  const newToken = `${newPayload}.${newSigHex}`;

  return new Response(JSON.stringify({
    refreshed: true,
    session: newToken,
    window: newWindow
  }, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
