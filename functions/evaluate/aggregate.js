export async function onRequest(context) {
  const req = context.request;
  const url = new URL(req.url);
  const payload = url.searchParams.get("payload") || "";

  // --- SIZE ---
  const encoder = new TextEncoder();
  const byteLength = encoder.encode(payload).length;
  const charLength = payload.length;

  let sizeClass = "small";
  if (byteLength > 128) sizeClass = "medium";
  if (byteLength > 512) sizeClass = "large";
  if (byteLength > 4096) sizeClass = "oversized";

  // --- ENTROPY ---
  let entropy = 0;
  let diversity = 0;

  if (payload.length > 0) {
    const freq = {};
    for (const ch of payload) freq[ch] = (freq[ch] || 0) + 1;

    const len = payload.length;
    diversity = Object.keys(freq).length;

    for (const ch in freq) {
      const p = freq[ch] / len;
      entropy -= p * Math.log2(p);
    }
  }

  let entropyClass = "low";
  if (entropy > 2.5) entropyClass = "medium";
  if (entropy > 3.5) entropyClass = "high";
  if (entropy > 4.5) entropyClass = "chaotic";

  // --- STRUCTURE ---
  let isJSON = false;
  let isXML = false;

  try {
    JSON.parse(payload);
    isJSON = true;
  } catch {}

  const trimmed = payload.trim();
  if (trimmed.startsWith("<") && trimmed.endsWith(">")) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(payload, "application/xml");
      if (!doc.querySelector("parsererror")) isXML = true;
    } catch {}
  }

  let structureClass = "plaintext";
  if (isJSON) structureClass = "json";
  else if (isXML) structureClass = "xml";
  else if (!trimmed) structureClass = "unknown";

  // --- FORMAT ---
  let formatClass = "plaintext";
  if (isJSON) formatClass = "json";
  else if (isXML) formatClass = "xml";
  else if (!trimmed) formatClass = "unknown";

  return new Response(JSON.stringify({
    evaluated: true,
    evaluation: {
      size: { byteLength, charLength, sizeClass },
      entropy: { entropy, diversity, entropyClass },
      structure: { structureClass },
      format: { formatClass }
    }
  }, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
