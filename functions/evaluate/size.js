export async function onRequest(context) {
  const req = context.request;
  const url = new URL(req.url);

  const payload = url.searchParams.get("payload") || "";

  const encoder = new TextEncoder();
  const byteLength = encoder.encode(payload).length;
  const charLength = payload.length;

  let sizeClass = "small";
  let reason = "within_small_bounds";

  if (byteLength > 128) {
    sizeClass = "medium";
    reason = "exceeds_small_threshold";
  }
  if (byteLength > 512) {
    sizeClass = "large";
    reason = "exceeds_medium_threshold";
  }
  if (byteLength > 4096) {
    sizeClass = "oversized";
    reason = "exceeds_large_threshold";
  }

  return new Response(JSON.stringify({
    evaluated: true,
    byteLength,
    charLength,
    sizeClass,
    reason
  }, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
