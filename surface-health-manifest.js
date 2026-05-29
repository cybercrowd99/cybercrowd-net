export async function onRequest({ env }) {
  const health = env.SURFACE_HEALTH_STATE || [];

  return new Response(JSON.stringify({ surfaces: health }, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
