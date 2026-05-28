// sovereign/sovereign-governance-surface.ts

import { CAPTURE_NET_SOVEREIGN_INTEGRATION } from "../capture-net/capture-net-sovereign-integration-manifest";
import { CDC_INTEGRATION_CHANNELS } from "./cdc-integration-layer";
import { WDIG_BINDINGS } from "./wdig-binding-layer";
import { CivicSignal } from "./civic-signal-layer";

export interface GovernanceView {
  id: string;
  label: string;
  payload: any;
}

export class SovereignGovernanceSurface {
  getGlobalOversight() {
    return CAPTURE_NET_SOVEREIGN_INTEGRATION.channels.find(
      (c) => c.id === "oversight.global"
    );
  }

  getDoctrineVectors() {
    return CAPTURE_NET_SOVEREIGN_INTEGRATION.channels.find(
      (c) => c.id === "meta.signals"
    );
  }

  getLineageArcs() {
    return CAPTURE_NET_SOVEREIGN_INTEGRATION.channels.find(
      (c) => c.id === "lineage.graphs"
    );
  }

  getStrategicConvergence() {
    return CAPTURE_NET_SOVEREIGN_INTEGRATION.channels.find(
      (c) => c.id === "strategic.intel"
    );
  }

  getMeshPropagation() {
    return WDIG_BINDINGS.map((b) => ({
      id: b.id,
      surfaces: b.surfaces,
      priority: b.priority,
      continuity: b.continuity
    }));
  }

  traceCivic(signal: CivicSignal) {
    return {
      class: signal.class,
      summary: signal.summary,
      vectors: signal.publicVectors,
      timestamp: signal.timestamp
    };
  }

  getGovernanceField(): GovernanceView[] {
    return [
      {
        id: "gov.oversight",
        label: "Global Oversight Posture",
        payload: this.getGlobalOversight()
      },
      {
        id: "gov.doctrine",
        label: "Doctrine Vectors",
        payload: this.getDoctrineVectors()
      },
      {
        id: "gov.lineage",
        label: "Lineage Arcs",
        payload: this.getLineageArcs()
      },
      {
        id: "gov.strategic",
        label: "Strategic Convergence",
        payload: this.getStrategicConvergence()
      },
      {
        id: "gov.mesh",
        label: "Mesh Propagation Map",
        payload: this.getMeshPropagation()
      }
    ];
  }
}
