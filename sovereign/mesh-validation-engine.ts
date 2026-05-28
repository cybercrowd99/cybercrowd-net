// sovereign/mesh-validation-engine.ts

import { DoctrineLayer } from "./doctrine-layer";
import { SovereignHarmonicsEngine } from "./sovereign-harmonics-engine";
import { SovereignResonanceMap } from "./sovereign-resonance-map";
import { WDIG_BINDINGS } from "./wdig-binding-layer";
import { CDC_INTEGRATION_CHANNELS } from "./cdc-integration-layer";
import { CIVIC_ROUTES } from "../civic/civic-transparency-dashboard";

export interface ValidationResult {
  id: string;
  status: "PASS" | "WARN" | "FAIL";
  details: string;
}

export class MeshValidationEngine {
  private doctrine = new DoctrineLayer();
  private harmonics = new SovereignHarmonicsEngine();
  private resonance = new SovereignResonanceMap();

  validateDoctrineToHarmonics(): ValidationResult {
    const vectors = this.doctrine.getDoctrineVectors();
    const harmonics = this.harmonics.computeUnifiedField();

    const mismatch = vectors.filter(
      (v) => !harmonics.find((h) => h.id.includes(v.id))
    );

    return mismatch.length === 0
      ? {
          id: "validation.doctrine.harmonics",
          status: "PASS",
          details: "All doctrine vectors have harmonic representations"
        }
      : {
          id: "validation.doctrine.harmonics",
          status: "WARN",
          details: `Missing harmonics for: ${mismatch
            .map((m) => m.id)
            .join(", ")}`
        };
  }

  validateHarmonicsToResonance(): ValidationResult {
    const harmonics = this.harmonics.computeUnifiedField();
    const field = this.resonance.generateField();

    const missing = harmonics.filter(
      (h) => !field.points.find((p) => p.id.includes(h.id))
    );

    return missing.length === 0
      ? {
          id: "validation.harmonics.resonance",
          status: "PASS",
          details: "All harmonics represented in resonance field"
        }
      : {
          id: "validation.harmonics.resonance",
          status: "WARN",
          details: `Missing resonance points for: ${missing
            .map((m) => m.id)
            .join(", ")}`
        };
  }

  validatePropagationChain(): ValidationResult {
    const wdig = WDIG_BINDINGS.length;
    const cdc = CDC_INTEGRATION_CHANNELS.length;
    const civic = CIVIC_ROUTES.length;

    const ok = wdig > 0 && cdc > 0 && civic > 0;

    return ok
      ? {
          id: "validation.propagation.chain",
          status: "PASS",
          details: "WDIG → CDC → Civic propagation chain intact"
        }
      : {
          id: "validation.propagation.chain",
          status: "FAIL",
          details: "Propagation chain incomplete"
        };
  }

  runAll(): ValidationResult[] {
    return [
      this.validateDoctrineToHarmonics(),
      this.validateHarmonicsToResonance(),
      this.validatePropagationChain()
    ];
  }
}
