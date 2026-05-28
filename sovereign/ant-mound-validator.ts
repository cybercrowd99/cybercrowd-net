export interface MeshToken {
  hardware_signature: string;
  path_signature: string;
  qr_signature: string;
  entropy_signature: number;
  external_signature: string;
  timestamp: string;
}

export interface AntMoundResult {
  status: "VALID" | "ANOMALY" | "HOSTILE";
  reason: string;
  score: number;
  timestamp: string;
}

export default {
  /**
   * Ant Mound Validator
   * -------------------
   * Validates the 5-point MeshToken by checking:
   * - pattern consistency
   * - geographic plausibility
   * - entropy stability
   * - external verification
   */

  async validate(token: MeshToken, env): Promise<AntMoundResult> {
    const patternScore = this.patternMatch(token);
    const geoScore = await this.geoCheck(token, env);
    const entropyScore = this.entropyCheck(token);

    const finalScore = (patternScore + geoScore + entropyScore) / 3;

    let status: AntMoundResult["status"] = "VALID";
    let reason = "Pattern and geography normal";

    if (finalScore < 0.45) {
      status = "ANOMALY";
      reason = "Unusual pattern or path detected";
    }

    if (finalScore < 0.25) {
      status = "HOSTILE";
      reason = "Severe mismatch in identity mesh";
    }

    return {
      status,
      reason,
      score: finalScore,
      timestamp: new Date().toISOString()
    };
  },

  patternMatch(token: MeshToken): number {
    let score = 0;

    if (token.hardware_signature !== "unknown") score += 0.3;
    if (token.qr_signature !== "expired") score += 0.3;
    if (token.external_signature !== "unverified") score += 0.4;

    return score;
  },

  async geoCheck(token: MeshToken, env): Promise<number> {
    const knownPaths = await env.GEO_DB
      ?.prepare("SELECT path FROM known_paths WHERE user_id = ?1")
      .bind(env.USER_ID)
      .all();

    const paths = knownPaths?.results?.map(r => r.path) || [];

    return paths.includes(token.path_signature) ? 1 : 0.2;
  },

  entropyCheck(token: MeshToken): number {
    const e = token.entropy_signature;
    if (e < 0.2) return 0.1;
    if (e < 0.5) return 0.5;
    return 1;
  }
};
