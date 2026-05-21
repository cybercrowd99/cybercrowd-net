export async function onRequest(context) {
  const req = context.request;

  const token =
    req.headers.get("authorization") ||
    req.headers.get("x-session-token") ||
    null;

  if (!token) {
    return new Response(JSON.stringify({
      hasToken: false,
      reason: "missing_token"
    }, null, 2), {
      headers: { "Content-Type": "application/json" }
    });
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return new Response(JSON.stringify({
      hasToken: true,
      validFormat: false,
      reason: "malformed_token"
    }, null, 2), {
      headers: { "Content-Type": "application/json" }
    });
  }

  const [payload] = parts;

  if (!payload.startsWith("cc_session|")) {
    return new Response(JSON.stringify({
      hasToken: true,
      validFormat: false,
      reason: "invalid_payload_prefix"
    }, null, 2), {
      headers: { "Content-Type": "application/json" }
    });
  }

  const windowStr = payload.split("|")[1];
  const window = parseInt(windowStr, 10);

  if (isNaN(window)) {
    return new Response(JSON.stringify({
      hasToken: true,
      validFormat: false,
      reason: "invalid_window"
    }, null, 2), {
      headers: { "Content-Type": "application/json" }
    });
  }

  const now = Date.now();
  const currentWindow = Math.floor(now / (15 * 60 * 1000));

  const ageWindows = currentWindow - window;

  let status = "current";
  if (ageWindows > 0) status = "stale";
  if (ageWindows > 2) status = "expired";

  return new Response(JSON.stringify({
    hasToken: true,
    validFormat: true,
    window,
    currentWindow,
    ageWindows,
    status
  }, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
