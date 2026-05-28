// sovereign/temporal-mesh.ts

import { SovereignContinuityLayer } from "./sovereign-continuity-layer";

export interface TemporalEpoch {
  id: string;
  index: number;
  startTimestamp: string;
  endTimestamp: string | null;
  continuityRef: string | null;
  alignmentScore: number;
}

export interface TemporalMeshState {
  epochs: TemporalEpoch[];
  activeEpochId: string;
  timestamp: string;
}

export class TemporalMesh {
  private continuity = new SovereignContinuityLayer();
  private epochs: TemporalEpoch[] = [];
  private activeEpochIndex = 0;

  private rand() {
    return Math.random();
  }

  private now() {
    return new Date().toISOString();
  }

  private startNewEpoch(continuityId: string | null): TemporalEpoch {
    const epoch: TemporalEpoch = {
      id: `epoch.${this.activeEpochIndex}`,
      index: this.activeEpochIndex,
      startTimestamp: this.now(),
      endTimestamp: null,
      continuityRef: continuityId,
      alignmentScore: this.rand()
    };
    this.epochs.push(epoch);
    this.activeEpochIndex += 1;
    return epoch;
  }

  advance(): TemporalMeshState {
    const timestamp = this.now();

    const continuityRecord = this.continuity.maintain();

    const lastEpoch = this.epochs[this.epochs.length - 1];
    if (lastEpoch && lastEpoch.endTimestamp === null) {
      lastEpoch.endTimestamp = timestamp;
    }

    const newEpoch = this.startNewEpoch(continuityRecord.id);

    const state: TemporalMeshState = {
      epochs: [...this.epochs],
      activeEpochId: newEpoch.id,
      timestamp
    };

    return state;
  }
}
