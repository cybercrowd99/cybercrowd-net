export async function onRequest(context) {
  const env = context.env;

  // Default to public mode if not configured
  const mode = env.CYBERCROWD_MODE || "public";

  return new Response(JSON.stringify({
    mode,
    ts: Date.now()
  }), {
    headers: { "Content-Type": "application/json" }
  });
}
