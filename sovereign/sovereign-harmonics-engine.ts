// sovereign/sovereign-harmonics-engine.ts

import { DoctrineLayer } from "./doctrine-layer";

export interface HarmonicField {
  id: string;
  frequency: number;
  amplitude: number;
  phase: number;
  effect: "STABILIZE" | "REVERSE" | "AMPLIFY" | "DAMPEN";
}

export class SovereignHarmonicsEngine {
  constructor(private doctrine = new DoctrineLayer()) {}

  computeVectorHarmonics() {
    return this.doctrine.getDoctrineVectors().map((v) => {
      const base =
        v.polarity === "STABLE"
          ? 1
          : v.polarity === "REVERSAL"
          ? -1
          : 0.5;

      return {
        id: `harmonic.vector.${v.id}`,
        frequency: base * 369,
        amplitude: Math.abs(base),
        phase: base < 0 ? Math.PI : 0,
        effect:
          v.polarity === "STABLE"
            ? "STABILIZE"
            : v.polarity === "REVERSAL"
            ? "REVERSE"
            : "AMPLIFY"
      } as HarmonicField;
    });
  }

  computeContradictionHarmonics() {
    return this.doctrine.getContradictionBlocks().map((b) => {
      const fn =
        b.function === "ANCHOR"
          ? "STABILIZE"
          : b.function === "REVERSAL"
          ? "REVERSE"
          : b.function === "AMPLIFIER"
          ? "AMPLIFY"
          : "DAMPEN";

      return {
        id: `harmonic.block.${b.id}`,
        frequency: 1086,
        amplitude: 1,
        phase: 0,
        effect: fn
      } as HarmonicField;
    });
  }

  computeUnifiedField(): HarmonicField[] {
    return [
      ...this.computeVectorHarmonics(),
      ...this.computeContradictionHarmonics(),
      ...this.doctrine.getHarmonics().map((h) => ({
        id: `harmonic.native.${h.id}`,
        frequency: h.frequency,
        amplitude: 1,
        phase: 0,
        effect: "AMPLIFY"
      }))
    ];
  }
}
