// sovereign/sovereign-action-layer.ts

import { SovereignActionCompiler } from "./sovereign-action-compiler";

export interface SovereignAction {
  id: string;
  epochIndex: number;
  force: number;
  coherence: number;
  action: Record<string, any>;
  timestamp: string;
}

export class SovereignActionLayer {
  private compiler = new SovereignActionCompiler();
  private actionIndex = 0;

  private rand() {
    return Math.random();
  }

  private now() {
    return new Date().toISOString();
  }

  execute(): SovereignAction {
    const timestamp = this.now();

    const primitive = this.compiler.compile();

    const force =
      this.rand() * 0.4 +
      primitive.executionWeight * 0.6;

    const coherence =
      this.rand() * 0.5 +
      primitive.stability * 0.5;

    const action = {
      primitiveId: primitive.id,
      epochIndex: primitive.epochIndex,
      executionWeight: primitive.executionWeight,
      stability: primitive.stability,
      payload: primitive.payload
    };

    const sovereignAction: SovereignAction = {
      id: `sovereignAction.${this.actionIndex}`,
      epochIndex: primitive.epochIndex,
      force,
      coherence,
      action,
      timestamp
    };

    this.actionIndex += 1;

    return sovereignAction;
  }
}
