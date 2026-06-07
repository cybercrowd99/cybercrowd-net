// capture/entropy_absorber.ts
// Capture‑Net: Entropy Absorber Organ

export class EntropyAbsorber {
  constructor(env: any) {
    this.env = env;
  }

  env: any;

  /**
   * Absorb a payload into the entropy sink.
   * Computes Shannon entropy and stores raw payload for forensic analysis.
   */
  async absorb(sessionId: string, payload: any) {
    const raw = JSON.stringify(payload || {});
    const entropy = this.calculateEntropy(raw);

    await this.env.CAPTURE_NET_DB
      ?.prepare(
        `INSERT INTO entropy_sink (session_id, ts, entropy, raw)
         VALUES (?1, ?2, ?3, ?4)`
      )
      .bind(sessionId, Date.now(), entropy, raw)
      .run();
  }

  /**
   * Shannon entropy calculation over a string.
   */
  calculateEntropy(str: string) {
    const freq: Record<string, number> = {};
    for (const c of str) freq[c] = (freq[c] || 0) + 1;

    const len = str.length;
    let entropy = 0;

    for (const c in freq) {
      const p = freq[c] / len;
      entropy -= p * Math.log2(p);
    }

    return entropy;
  }

  /**
   * Dump all entropy sink entries for a session in chronological order.
   */
  async dump(sessionId: string) {
    const rows = await this.env.CAPTURE_NET_DB
      ?.prepare(
        `SELECT ts, entropy, raw
         FROM entropy_sink
         WHERE session_id = ?1
         ORDER BY ts ASC`
      )
      .bind(sessionId)
      .all();

    return rows?.results || [];
  }
}
