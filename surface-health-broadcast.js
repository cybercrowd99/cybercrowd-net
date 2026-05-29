export async function onRequest({ env }) {
  const router = env.SURFACE_HEALTH_ROUTER;
  const state = env.SURFACE_HEALTH_STATE || [];

  if (router && typeof router.broadcast === "function") {
    router.broadcast(state);
  }

  return new Response(JSON.stringify({ broadcast: true, surfaces: state }, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
