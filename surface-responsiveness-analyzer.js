export class SurfaceResponsivenessAnalyzer {
  analyze(livenessResults) {
    const reports = [];

    for (const entry of livenessResults) {
      const { id, alive, delta } = entry;

      let driftSeverity = 0;
      if (delta > 0 && delta <= 50) driftSeverity = 1;
      else if (delta <= 150) driftSeverity = 2;
      else if (delta <= 300) driftSeverity = 3;
      else driftSeverity = 4;

      const lagClass =
        delta <= 50 ? "normal" :
        delta <= 150 ? "mild_lag" :
        delta <= 300 ? "heavy_lag" :
        "critical";

      const stallProbability =
        alive ? Math.min(delta / 1000, 1) : 1;

      reports.push({
        id,
        alive,
        delta,
        driftSeverity,
        lagClass,
        stallProbability,
        stabilityScore: alive ? 1 - stallProbability : 0
      });
    }

    return reports;
  }
}
