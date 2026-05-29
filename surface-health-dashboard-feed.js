export async function onRequest({ env }) {
  const store = env.SURFACE_HEALTH_SNAPSHOT_STORE;

  const snapshot = store && typeof store.getSnapshot === "function"
    ? store.getSnapshot()
    : { timestamp: 0, surfaces: [] };

  const feed = {
    generatedAt: snapshot.timestamp,
    surfaces: snapshot.surfaces.map(s => ({
      id: s.id,
      alive: s.alive,
      healthScore: s.healthScore,
      degraded: s.degraded,
      lagClass: s.lagClass,
      driftSeverity: s.driftSeverity
    }))
  };

  return new Response(JSON.stringify(feed, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
