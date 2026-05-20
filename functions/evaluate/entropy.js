export async function onRequest(context) {
  const req = context.request;
  const url = new URL(req.url);

  const payload = url.searchParams.get("payload") || "";

  if (!payload.length) {
    return new Response(JSON.stringify({
      evaluated: true,
      entropy: 0,
      diversity: 0,
      entropyClass: "low",
      reason: "empty_payload"
    }, null, 2), {
      headers: { "Content-Type": "application/json" }
    });
  }

  const freq = {};
  for (const ch of payload) {
    freq[ch] = (freq[ch] || 0) + 1;
  }

  const len = payload.length;
  let entropy = 0;

  for (const ch in freq) {
    const p = freq[ch] / len;
    entropy -= p * Math.log2(p);
  }

  const diversity = Object.keys(freq).length;

  let entropyClass = "low";
  let reason = "within_low_bounds";

  if (entropy > 2.5) {
    entropyClass = "medium";
    reason = "exceeds_low_threshold";
  }
  if (entropy > 3.5) {
    entropyClass = "high";
    reason = "exceeds_medium_threshold";
  }
  if (entropy > 4.5) {
    entropyClass = "chaotic";
    reason = "exceeds_high_threshold";
  }

  return new Response(JSON.stringify({
    evaluated: true,
    entropy,
    diversity,
    entropyClass,
    reason
  }, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
