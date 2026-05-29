// sovereign/surface-output-driver.ts

import { SurfaceRenderPipeline } from "./surface-render-pipeline";

export interface OutputEmission {
  id: string;
  epochIndex: number;
  surfaces: string[];
  fidelity: number;
  emitted: Record<string, any>;
  timestamp: string;
}

export class SurfaceOutputDriver {
  private pipeline = new SurfaceRenderPipeline();
  private emissionIndex = 0;

  private rand() {
    return Math.random();
  }

  private now() {
    return new Date().toISOString();
  }

  private emitToSurface(surface: string, frame: any) {
    return {
      surface,
      domUpdate: true,
      jsHook: `${surface}-onFrame`,
      payload: frame
    };
  }

  emit(): OutputEmission {
    const timestamp = this.now();

    const frame = this.pipeline.render();

    const fidelity =
      this.rand() * 0.4 +
      frame.fidelity * 0.6;

    const emitted: Record<string, any> = {};

    for (const surface of frame.surfaces) {
      emitted[surface] = this.emitToSurface(surface, frame.frameData[surface]);
    }

    const emission: OutputEmission = {
      id: `outputEmission.${this.emissionIndex}`,
      epochIndex: frame.epochIndex,
      surfaces: frame.surfaces,
      fidelity,
      emitted,
      timestamp
    };

    this.emissionIndex += 1;

    return emission;
  }
}
