// sovereign/surface-heartbeat-engine.ts

import { SurfaceOutputDriver } from "./surface-output-driver";

export interface HeartbeatPulse {
  id: string;
  epochIndex: number;
  tick: number;
  fidelity: number;
  emitted: Record<string, any>;
  timestamp: string;
}

export class SurfaceHeartbeatEngine {
  private driver = new SurfaceOutputDriver();
  private pulseIndex = 0;
  private tickCounter = 0;

  private rand() {
    return Math.random();
  }

  private now() {
    return new Date().toISOString();
  }

  pulse(): HeartbeatPulse {
    const timestamp = this.now();

    const emission = this.driver.emit();

    const fidelity =
      this.rand() * 0.4 +
      emission.fidelity * 0.6;

    const pulse: HeartbeatPulse = {
      id: `heartbeatPulse.${this.pulseIndex}`,
      epochIndex: emission.epochIndex,
      tick: this.tickCounter,
      fidelity,
      emitted: emission.emitted,
      timestamp
    };

    this.pulseIndex += 1;
    this.tickCounter += 1;

    return pulse;
  }
}
