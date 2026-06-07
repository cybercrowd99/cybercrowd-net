// digital/trajectory_director.ts
// APP: Trajectory Director Organ

export class TrajectoryDirector {
  constructor(deps: {
    gyroscope: any;
    stabilityClock: any;
    riskController: any;
    dispatcher: any;
    temporalGhosting: any;
    refinery: any;
  }) {
    this.gyroscope = deps.gyroscope;
    this.stabilityClock = deps.stabilityClock;
    this.riskController = deps.riskController;
    this.dispatcher = deps.dispatcher;
    this.temporalGhosting = deps.temporalGhosting;
    this.refinery = deps.refinery;

    this.currentProfile = this.buildProfile("NORMAL");
  }

  gyroscope: any;
  stabilityClock: any;
  riskController: any;
  dispatcher: any;
  temporalGhosting: any;
  refinery: any;

  currentProfile: any;

  // Build a flight profile for a given mode
  buildProfile(mode: string) {
    const timestamp = Date.now();

    switch (mode) {
      case "ELEVATED":
        return {
          mode,
          timestamp,
          targets: {
            target_latency_band: "medium",
            acceptable_error_rate: 0.02,
            throttle_aggressiveness: "medium",
            forensic_depth: "medium"
          },
          hints: {
            scaling: "moderate",
            advisory: ["increase-protection-tier"]
          }
        };

      case "HIGH_ALERT":
        return {
          mode,
          timestamp,
          targets: {
            target_latency_band: "high",
            acceptable_error_rate: 0.05,
            throttle_aggressiveness: "high",
            forensic_depth: "deep"
          },
          hints: {
            scaling: "aggressive",
            advisory: ["protect-tenants-X-more-aggressively"]
          }
        };

      case "DEGRADED":
        return {
          mode,
          timestamp,
          targets: {
            target_latency_band: "low",
            acceptable_error_rate: 0.10,
            throttle_aggressiveness: "low",
            forensic_depth: "shallow"
          },
          hints: {
            scaling: "minimal",
            advisory: ["resource-conservation"]
          }
        };

      default:
        return {
          mode: "NORMAL",
          timestamp,
          targets: {
            target_latency_band: "low",
            acceptable_error_rate: 0.01,
            throttle_aggressiveness: "low",
            forensic_depth: "standard"
          },
          hints: {
            scaling: "normal",
            advisory: []
          }
        };
    }
  }

  // Evaluate posture + telemetry → determine mode
  evaluateMode() {
    const posture = this.gyroscope.getPosture();
    const risk = this.riskController.getRiskSummary();
    const latency = this.temporalGhosting.getLatencySummary();
    const anomalies = this.refinery.getAnomalyDensity();

    if (risk.level === "HIGH" || anomalies > 0.8) return "HIGH_ALERT";
    if (risk.level === "ELEVATED" || latency.band === "high") return "ELEVATED";
    if (latency.band === "critical") return "DEGRADED";

    return "NORMAL";
  }

  // Control loop: update profile if needed
  tick() {
    const newMode = this.evaluateMode();

    if (newMode !== this.currentProfile.mode) {
      this.currentProfile = this.buildProfile(newMode);
      this.distributeProfile();
    }
  }

  // Distribute profile to APP organs
  distributeProfile() {
    const profile = this.currentProfile;

    this.dispatcher.applyDirectorHints(profile.hints);
    this.temporalGhosting.applyTimingTargets(profile.targets);
    this.stabilityClock.applyMode(profile.mode);
    this.riskController.applyMode(profile.mode);
    this.refinery.applyForensicDepth(profile.targets.forensic_depth);
    this.gyroscope.confirmProfile(profile.mode);
  }

  // Unified status surface
  getStatus() {
    return {
      mode: this.currentProfile.mode,
      profile: this.currentProfile,
      summaries: {
        request_rate: this.dispatcher.getRateBand(),
        latency: this.temporalGhosting.getLatencySummary(),
        throttle_ratio: this.riskController.getThrottleRatio(),
        anomaly_density: this.refinery.getAnomalyDensity()
      },
      health: {
        dispatcher: this.dispatcher.health(),
        temporalGhosting: this.temporalGhosting.health(),
        refinery: this.refinery.health(),
        gyroscope: this.gyroscope.health(),
        riskController: this.riskController.health(),
        stabilityClock: this.stabilityClock.health()
      }
    };
  }
}
