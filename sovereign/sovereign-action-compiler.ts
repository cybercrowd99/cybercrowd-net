// sovereign/sovereign-action-compiler.ts

import { SovereignTemporalGovernor } from "./sovereign-temporal-governor";

export interface SovereignActionPrimitive {
  id: string;
  epochIndex: number;
  executionWeight: number;
  stability: number;
  payload: Record<string, any>;
  timestamp: string;
}

export class SovereignActionCompiler {
  private governor = new SovereignTemporalGovernor();
  private actionIndex = 0;

  private rand() {
    return Math.random();
  }

  private now() {
    return new Date().toISOString();
  }

  compile(): SovereignActionPrimitive {
    const timestamp = this.now();

    const auth = this.governor.authorize();

    const executionWeight =
      this.rand() * 0.4 +
      auth.gateScore * 0.6;

    const stability =
      this.rand() * 0.5 +
      (auth.authorized ? auth.gateScore : 0) * 0.5;

    const payload = {
      authorizationId: auth.id,
      epochIndex: auth.epochIndex,
      authorized: auth.authorized,
      gateScore: auth.gateScore,
      rationale: auth.rationale
    };

    const primitive: SovereignActionPrimitive = {
      id: `actionPrimitive.${this.actionIndex}`,
      epochIndex: auth.epochIndex,
      executionWeight,
      stability,
      payload,
      timestamp
    };

    this.actionIndex += 1;

    return primitive;
  }
}
