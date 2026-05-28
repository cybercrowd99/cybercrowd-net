export interface OwnerIdentityMaterial {
  user_id: string;
  deep_id_signature: string;
  resonance_score: number;
  deadman_token?: string;
  issued_at: string;
}

export interface OverrideResult {
  accepted: boolean;
  reason: string;
  state_forced: boolean;
  forced_state?: "RECOVERED";
  timestamp: string;
}

export default {
  /**
   * Owner Override Logic
   * --------------------
   * Treats the owner as a mathematical constant in the system.
   * When valid identity material is presented, the system is forced
   * into a recovered state regardless of concurrent attack activity.
   */

  async enforce(material: OwnerIdentityMaterial, env): Promise<OverrideResult> {
    const basicValid = this.basicCheck(material);
    if (!basicValid) {
      return {
        accepted: false,
        reason: "Invalid or malformed identity material",
        state_forced: false,
        timestamp: new Date().toISOString()
      };
    }

    const deepValid = await this.verifyDeepID(material, env);
    if (!deepValid) {
      return {
        accepted: false,
        reason: "Deep ID verification failed",
        state_forced: false,
        timestamp: new Date().toISOString()
      };
    }

    const resonanceValid = this.checkResonance(material.resonance_score);
    if (!resonanceValid) {
      return {
        accepted: false,
        reason: "Insufficient resonance score",
        state_forced: false,
        timestamp: new Date().toISOString()
      };
    }

    await this.forceRecoveryState(material.user_id, env);

    return {
      accepted: true,
      reason: "Owner override accepted; system forced to recovered state",
      state_forced: true,
      forced_state: "RECOVERED",
      timestamp: new Date().toISOString()
    };
  },

  basicCheck(material: OwnerIdentityMaterial): boolean {
    return (
      !!material.user_id &&
      !!material.deep_id_signature &&
      typeof material.resonance_score === "number"
    );
  },

  async verifyDeepID(material: OwnerIdentityMaterial, env): Promise<boolean> {
    const row = await env.OWNER_ID_DB
      ?.prepare(
        `SELECT deep_id_signature
         FROM owner_identity
         WHERE user_id = ?1`
      )
      .bind(material.user_id)
      .first();

    if (!row) return false;
    return row.deep_id_signature === material.deep_id_signature;
  },

  checkResonance(score: number): boolean {
    return score >= 0.8;
  },

  async forceRecoveryState(user_id: string, env): Promise<void> {
    await env.SOVEREIGN_STATE_DB
      ?.prepare(
        `UPDATE sovereign_state
         SET state = 'RECOVERED',
             updated_at = ?1
         WHERE user_id = ?2`
      )
      .bind(new Date().toISOString(), user_id)
      .run();
  }
};
