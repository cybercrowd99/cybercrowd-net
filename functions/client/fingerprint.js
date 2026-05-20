export async function onRequest(context) {
  const req = context.request;
  const headers = req.headers;

  const ua = headers.get("user-agent") || "";
  const accept = headers.get("accept") || "";
  const platform = headers.get("sec-ch-ua-platform") || "";
  const country = (req.cf && req.cf.country) || "XX";

  const input = `${ua}|${accept}|${platform}|${country}`;

  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

  const short = hashHex.substring(0, 16);

  return new Response(JSON.stringify({
    fingerprint: short,
    components: {
      ua,
      accept,
      platform,
      country
    }
  }, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
