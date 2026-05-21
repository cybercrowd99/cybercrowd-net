export async function onRequest(context) {
  const env = context.env;

  const version = env.CYBERCROWD_VERSION || "0.0.0";
  const environment = env.CYBERCROWD_ENV || "unknown";
  const build = env.CYBERCROWD_BUILD || "unknown";
  const deployed = env.CYBERCROWD_DEPLOYED_AT || "0";

  const payload = `${version}:${environment}:${build}:${deployed}`;
  const data = new TextEncoder().encode(payload);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = Array.from(new Uint8Array(digest));

  return new Response(JSON.stringify({
    fingerprint: bytes,
    ts: Date.now()
  }, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
