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
  let reason = "within_filter_bounds";

  if (length > 64) {
    classification = "needs_sanitation";
    reason = "exceeds_sanitation_threshold";
  }
  if (length > 256) {
    classification = "needs_normalization";
    reason = "exceeds_normalization_threshold";
  }
  if (length > 1024) {
    classification = "rejected";
    reason = "exceeds_filter_rejection_threshold";
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

