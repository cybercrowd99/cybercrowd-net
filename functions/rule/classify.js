export async function onRequest(context) {
  const req = context.request;
  const url = new URL(req.url);

  const payload = url.searchParams.get("payload") || "";

  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(payload));
  const arr = Array.from(new Uint8Array(buf));
  const hash = arr.map(b => b.toString(16).padStart(2, "0")).join("");

  const length = payload.length;

  let classification = "normal";
  let reason = "within_operational_bounds";

  if (length > 128) {
    classification = "irregular";
    reason = "exceeds_irregular_threshold";
  }
  if (length > 512) {
    classification = "anomalous";
    reason = "exceeds_anomaly_threshold";
  }
  if (length > 2048) {
    classification = "forbidden";
    reason = "exceeds_forbidden_threshold";
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
