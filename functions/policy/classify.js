export async function onRequest(context) {
  const req = context.request;
  const url = new URL(req.url);

  const payload = url.searchParams.get("payload") || "";

  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(payload));
  const arr = Array.from(new Uint8Array(buf));
  const hash = arr.map(b => b.toString(16).padStart(2, "0")).join("");

  const length = payload.length;

  let classification = "clean";
  let reason = "within_normal_bounds";

  if (length > 64) {
    classification = "symbolic";
    reason = "exceeds_symbolic_threshold";
  }
  if (length > 256) {
    classification = "volatile";
    reason = "exceeds_volatility_threshold";
  }
  if (length > 1024) {
    classification = "collapse_risk";
    reason = "exceeds_collapse_threshold";
  }

  return new Response(JSON.stringify({
    classified: true,
    payloadLength: length,
    classification,
    hash,
    reason
  }, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
