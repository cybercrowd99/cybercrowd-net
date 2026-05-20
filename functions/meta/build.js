export async function onRequest(context) {
  const env = context.env;

  const build = env.CYBERCROWD_BUILD || "unknown";
  const origin = env.CYBERCROWD_BUILD_ORIGIN || "local";
  const pipeline = env.CYBERCROWD_PIPELINE || "none";
  const builtAt = env.CYBERCROWD_BUILT_AT || Date.now();

  return new Response(JSON.stringify({
    build,
    origin,
    pipeline,
    builtAt
  }, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
