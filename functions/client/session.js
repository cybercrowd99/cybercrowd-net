export async function onRequest(context) {
  const req = context.request;
  const headers = req.headers;
  const cf = req.cf || {};

  const ua = headers.get("user-agent") || "";
  const accept = headers.get("accept") || "";
  const platform = headers.get("sec-ch-ua-platform") || "";
  const country = cf.country || "XX";

  const tls = cf.tlsVersion || "";
  const proto = cf.httpProtocol || "";

  const now = Date.now();
  const bucket = Math.floor(now / (5 * 60 * 1000));

  const input = `${ua}|${accept}|${platform}|${country}|${tls}|${proto}|${bucket}`;

  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

  const token = hashHex.substring(0, 20);

  return new Response(JSON.stringify({
    session: token,
    bucket,
    components: {
      ua,
      accept,
      platform,
      country,
      tls,
      proto
    }
  }, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
