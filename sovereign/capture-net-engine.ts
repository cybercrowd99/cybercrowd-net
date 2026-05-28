export interface CaptureNetContext {
  session_id: string;
  ip: string;
  user_agent: string;
  ant_status: "ANOMALY" | "HOSTILE";
  seed: string;
  created_at: string;
}

export interface CaptureNetResult {
  session_id: string;
  ui: string;
  siphon_packet: string;
  report_ready: boolean;
  timestamp: string;
}

export default {
  /**
   * Capture Net Engine
   * ------------------
   * Mirrors attacker interactions into a decoy interface,
   * siphons telemetry, and prepares abuse reports.
   */

  engage(context: CaptureNetContext): CaptureNetResult {
    const ui = this.generateUI(context);
    const siphon_packet = this.generateSiphon(context);
    const report_ready = context.ant_status === "HOSTILE";

    return {
      session_id: context.session_id,
      ui,
      siphon_packet,
      report_ready,
      timestamp: new Date().toISOString()
    };
  },

  generateUI(context: CaptureNetContext): string {
    const base = `${context.seed}|${context.ip}|${context.user_agent}`;
    let hash = 0;

    for (let i = 0; i < base.length; i++) {
      hash = (hash * 33 + base.charCodeAt(i)) >>> 0;
    }

    const variant = hash % 3;

    switch (variant) {
      case 0:
        return "FAKE_DASHBOARD_V1";
      case 1:
        return "FAKE_DASHBOARD_V2";
      default:
        return "LOADING_LOOP_V1";
    }
  },

  generateSiphon(context: CaptureNetContext): string {
    const raw = `${context.ip}|${context.user_agent}|${context.created_at}`;
    let hash = 0;

    for (let i = 0; i < raw.length; i++) {
      hash = (hash * 31 + raw.charCodeAt(i)) >>> 0;
    }

    return hash.toString(16).padStart(8, "0");
  }
};
