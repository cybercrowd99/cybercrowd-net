// sovereign/crown-layer.ts

import { SovereignSynthesisOrgan } from "./sovereign-synthesis-organ";

export interface CrownDirective {
  id: string;
  posture: "STABILITY" | "ESCALATION" | "NEUTRAL";
  weight: number;
  packet: Record<string, any>;
  timestamp: string;
}

export interface CrownOutput {
  directives: CrownDirective[];
  timestamp: string;
}

export class CrownLayer {
  private synthesis = new SovereignSynthesisOrgan();

  private determinePosture(weight: number, directive: string) {
    if (directive === "maintain-stability") return "STABILITY";
    if (directive === "prepare-escalation-buffer") return "ESCALATION";
    return weight > 0.5 ? "ESCALATION" : "NEUTRAL";
  }

  adjudicate(): CrownOutput {
    const timestamp = new Date().toISOString();

    const synth = this.synthesis.synthesize();

    const directives: CrownDirective[] = synth.states.map((s) => ({
      id: `crown.${s.id}`,
      posture: this.determinePosture(s.weight, s.directive),
      weight: s.weight,
      packet: s.packet,
      timestamp
    }));

    return {
      directives,
      timestamp
    };
  }
}
