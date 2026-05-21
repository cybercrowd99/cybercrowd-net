export async function onRequest(context) {
  const env = context.env;

  const environment =
    env.CYBERCROWD_ENV ||
    env.NODE_ENV ||
    "unknown";

  return new Response(JSON.stringify({
    environment,
    ts: Date.now()
  }, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
