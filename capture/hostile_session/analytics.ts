// capture/hostile_session/analytics.ts
// Capture‑Net: Hostile Session Analytics Organ

export class HostileSessionAnalytics {
  constructor(private env: any) {}

  /**
   * Aggregate hostile session catalog entries into summary statistics.
   */
  async aggregate() {
    const rows = await this.env.CAPTURE_NET_DB
      ?.prepare(
        `SELECT session_id, attributes
         FROM hostile_catalog
         ORDER BY ts ASC`
      )
      .all();

    const entries = (rows?.results || []).map((r: any) => ({
      session_id: r.session_id,
      attributes: JSON.parse(r.attributes || "{}")
    }));

    const stats = {
      count: entries.length,
      riskScores: [] as number[],
      escalationLevels: {} as Record<string, number>,
      containmentEvents: 0
    };

    for (const e of entries) {
      if (typeof e.attributes.risk === "number") {
        stats.riskScores.push(e.attributes.risk);
      }

      if (e.attributes.escalation) {
        const lvl = e.attributes.escalation;
        stats.escalationLevels[lvl] =
          (stats.escalationLevels[lvl] || 0) + 1;
      }

      if (e.attributes.contained === true) {
        stats.containmentEvents++;
      }
    }

    return stats;
  }

  /**
   * Cluster sessions by a given attribute.
   */
  async clusterBy(attribute: string) {
    const rows = await this.env.CAPTURE_NET_DB
      ?.prepare(
        `SELECT session_id, attributes
         FROM hostile_catalog
         ORDER BY ts ASC`
      )
      .all();

    const clusters: Record<string, string[]> = {};

    for (const r of rows?.results || []) {
      const attrs = JSON.parse(r.attributes || "{}");
      const key = attrs[attribute] ?? "undefined";

      if (!clusters[key]) clusters[key] = [];
      clusters[key].push(r.session_id);
    }

    return clusters;
  }

  /**
   * Find sessions where a specific attribute matches a given value.
   */
  async findRecurring(patternKey: string, patternValue: any) {
    const rows = await this.env.CAPTURE_NET_DB
      ?.prepare(
        `SELECT session_id, attributes
         FROM hostile_catalog`
      )
      .all();

    return (rows?.results || [])
      .map((r: any) => ({
        session_id: r.session_id,
        attributes: JSON.parse(r.attributes || "{}")
      }))
      .filter((e: any) => e.attributes?.[patternKey] === patternValue)
      .map((e: any) => e.session_id);
  }
}
