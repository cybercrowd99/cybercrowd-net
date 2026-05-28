export interface GhostSessionContext {
  id: string;
  ip: string;
  user_agent: string;
  mesh_score: number;
  ant_status: "VALID" | "ANOMALY" | "HOSTILE";
  created_at: string;
}

export interface GhostSessionView {
  session_id: string;
  ui_variant: "FAKE_DASHBOARD" | "LOADING_LOOP" | "ERROR_LOOP";
  seed: string;
  created_at: string;
}

export default {
  /**
   * Ghost Session Engine
   * --------------------
   * Creates decoy sessions for anomalous or hostile attempts.
   * Presents fake UI while isolating the attacker from real data.
   */

  create(context: GhostSessionContext): GhostSessionView {
    const ui_variant = this.pickVariant(context);
    const seed = this.seedFromContext(context);

    return {
      session_id: context.id,
      ui_variant,
      seed,
      created_at: new Date().toISOString()
    };
  },

  pickVariant(context: GhostSessionContext): GhostSessionView["ui_variant"] {
    if (context.ant_status === "HOSTILE") return "FAKE_DASHBOARD";
    if (context.ant_status === "ANOMALY") return "LOADING_LOOP";
    return "ERROR_LOOP";
  },

  seedFromContext(context: GhostSessionContext): string {
    const base = `${context.ip}|${context.user_agent}|${context.mesh_score}|${context.created_at}`;
    let hash = 0;

    for (let i = 0; i < base.length; i++) {
      hash = (hash * 31 + base.charCodeAt(i)) >>> 0;
    }

    return hash.toString(16).padStart(8, "0");
  }
};
