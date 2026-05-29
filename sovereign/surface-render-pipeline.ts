// sovereign/surface-render-pipeline.ts

import { SurfaceStateOrchestrator } from "./surface-state-orchestrator";

export interface RenderFrame {
  id: string;
  epochIndex: number;
  surfaces: string[];
  frameData: Record<string, any>;
  fidelity: number;
  timestamp: string;
}

export class SurfaceRenderPipeline {
  private orchestrator = new SurfaceStateOrchestrator();
  private frameIndex = 0;

  private rand() {
    return Math.random();
  }

  private now() {
    return new Date().toISOString();
  }

  private extractFrameData(state: Record<string, any>): Record<string, any> {
    const frame: Record<string, any> = {};
    for (const surface in state) {
      frame[surface] = {
        lastEventId: state[surface].lastEventId,
        payload: state[surface].payload,
        magnitude: state[surface].magnitude
      };
    }
    return frame;
  }

  render(): RenderFrame {
    const timestamp = this.now();

    const snapshot = this.orchestrator.orchestrate();

    const fidelity =
      this.rand() * 0.4 +
      snapshot.coherence * 0.6;

    const frameData = this.extractFrameData(snapshot.surfaces);

    const frame: RenderFrame = {
      id: `renderFrame.${this.frameIndex}`,
      epochIndex: snapshot.epochIndex,
      surfaces: Object.keys(snapshot.surfaces),
      frameData,
      fidelity,
      timestamp
    };

    this.frameIndex += 1;

    return frame;
  }
}
