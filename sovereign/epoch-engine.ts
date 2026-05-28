// sovereign/epoch-engine.ts

import { TemporalMesh } from "./temporal-mesh";

export interface EpochState {
  id: string;
  index: number;
  weight: number;
  harmonic: number;
  inherited: Record<string, any>;
  timestamp: string;
}

export class EpochEngine {
  private mesh = new TemporalMesh();
  private epochIndex = 0;

  private rand() {
    return Math.random();
  }

  private now() {
    return new Date().toISOString();
  }

  generate(): EpochState {
    const timestamp = this.now();

    const meshState = this.mesh.advance();

    const weight = this.rand();
    const harmonic = this.rand();

    const inherited = {
      previousEpoch: meshState.epochs[meshState.epochs.length - 2]?.id ?? null,
      continuityRef:
        meshState.epochs[meshState.epochs.length - 1]?.continuityRef ?? null
    };

    const state: EpochState = {
      id: `epochState.${this.epochIndex}`,
      index: this.epochIndex,
      weight,
      harmonic,
      inherited,
      timestamp
    };

    this.epochIndex += 1;

    return state;
  }
}
