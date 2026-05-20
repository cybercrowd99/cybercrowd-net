export async function onRequest(context) {
  const env = context.env;

  const version = env.CYBERCROWD_VERSION || "0.0.0";
  const build = env.CYBERCROWD_BUILD || "unknown";
  const deployed = env.CYBERCROWD_DEPLOYED_AT || Date.now();

  return new Response(JSON.stringify({
    version,
    build,
    deployed
  }, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
