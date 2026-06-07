// capture/lineage_engine.ts
// Capture‑Net: Lineage Engine Organ

import { CAPTURE_NET_SOVEREIGN_INTEGRATION } from "../capture-net/capture-net-sovereign-integration-manifest";

export interface LineageFragment {
  id: string;
  parent?: string;
  attributes: Record<string, any>;
}

export interface LineageArc {
  id: string;
  chain: string[];
  attributes: Record<string, any>;
}

export interface LineageSynthesis {
  arcs: LineageArc[];
  timestamp: string;
  mode: "standard";
}

export class LineageEngine {
  // Pull lineage fragments from sovereign integration
  private getFragments(): LineageFragment[] {
    const lineage = CAPTURE_NET_SOVEREIGN_INTEGRATION.channels.find(
      (c) => c.id === "lineage.graphs"
    );

    return lineage?.fragments ?? [];
  }

  // Build a lineage arc by walking parent pointers
  private buildArc(start: LineageFragment, all: LineageFragment[]): LineageArc {
    const chain = [start.id];
    let current = start;

    while (current.parent) {
      const parent = all.find((f) => f.id === current.parent);
      if (!parent) break;
      chain.push(parent.id);
      current = parent;
    }

    return {
      id: `arc.${start.id}`,
      chain,
      attributes: start.attributes
    };
  }

  // Main synthesis surface
  synthesize(): LineageSynthesis {
    const timestamp = new Date().toISOString();
    const fragments = this.getFragments();

    const arcs = fragments.map((f) => this.buildArc(f, fragments));

    return {
      arcs,
      timestamp,
      mode: "standard"
    };
  }
}
