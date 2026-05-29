export class SurfaceHealthAggregator {
  aggregate(livenessResults, responsivenessReports) {
    const map = new Map();

    for (const l of livenessResults) {
      map.set(l.id, {
        id: l.id,
        alive: l.alive,
        delta: l.delta,
        lastSeen: l.lastSeen
      });
    }

    for (const r of responsivenessReports) {
      const base = map.get(r.id) || { id: r.id };
      base.driftSeverity = r.driftSeverity;
      base.lagClass = r.lagClass;
      base.stallProbability = r.stallProbability;
      base.stabilityScore = r.stabilityScore;
      map.set(r.id, base);
    }

    const results = [];

    for (const entry of map.values()) {
      const {
        id,
        alive,
        delta,
        driftSeverity = 0,
        lagClass = "unknown",
        stallProbability = 0,
        stabilityScore = 1
      } = entry;

      const healthScore = alive
        ? Math.max(0, 1 - stallProbability) * (1 - driftSeverity * 0.1)
        : 0;

      const degraded =
        !alive ||
        driftSeverity >= 3 ||
        stallProbability >= 0.8 ||
        stabilityScore <= 0.2;

      results.push({
        id,
        alive,
        delta,
        driftSeverity,
        lagClass,
        stallProbability,
        stabilityScore,
        healthScore,
        degraded
      });
    }

    return results;
  }
}
