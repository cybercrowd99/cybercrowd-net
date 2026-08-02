// capture/hostile_session/civilization_threat_map.ts
// Capture‑Net: Civilization Threat Map Organ

interface ThreatMapNode {
  id: string;
  label: string;
  type: "ADVERSARY" | "EPOCH" | "CAMPAIGN" | "OBJECTIVE" | "BEHAVIOR";
  signals: string[];
}

interface ThreatMapEdge {
  from: string;
  to: string;
  relation: string;
}

interface CivilizationThreatMap {
  adversaryId: string;
  nodes: ThreatMapNode[];
  edges: ThreatMapEdge[];
  projectedVectors: string[];
  generatedAt: string;
}

interface ThreatMapResult {
  adversaryId: string;
  map: CivilizationThreatMap;
  timestamp: string;
}

interface StrategicIntelligence {
  adversaryId: string;
  objectives: string[];
  campaignArcs: string[];
  operationalDoctrine: string[];
  projectedBehaviors: string[];
  lineageNodes: string[];
  lineageEdges: string[];
}

export class CivilizationThreatMapGenerator {
  constructor(
    private strategicSynth: {
      synthesize: (
        adversaryId: string
      ) => Promise<{ strategic: StrategicIntelligence }>;
    }
  ) {}

  /**
   * Generate a civilization‑grade threat map for an adversary.
   */
  async generate(adversaryId: string): Promise<ThreatMapResult> {
    const { strategic } = await this.strategicSynth.synthesize(adversaryId);
    const timestamp = new Date().toISOString();

    const nodes: ThreatMapNode[] = [];

    // --- Adversary root node ---
    nodes.push({
      id: strategic.adversaryId,
      label: "Adversary",
      type: "ADVERSARY",
      signals: [...strategic.operationalDoctrine]
    });

    // --- Objectives ---
    strategic.objectives.forEach(o =>
      nodes.push({
        id: crypto.randomUUID(),
        label: o,
        type: "OBJECTIVE",
        signals: [o]
      })
    );

    // --- Campaign arcs ---
    strategic.campaignArcs.forEach(c =>
      nodes.push({
        id: crypto.randomUUID(),
        label: c,
        type: "CAMPAIGN",
        signals: [c]
      })
    );

    // --- Epoch lineage nodes ---
    strategic.lineageNodes.forEach(ln =>
      nodes.push({
        id: ln,
        label: `Epoch ${ln}`,
        type: "EPOCH",
        signals: []
      })
    );

    // --- Projected behaviors ---
    strategic.projectedBehaviors.forEach(b =>
      nodes.push({
        id: crypto.randomUUID(),
        label: b,
        type: "BEHAVIOR",
        signals: [b]
      })
    );

    // --- Edges ---
    const edges: ThreatMapEdge[] = [];

    // Associate all non‑adversary nodes with the adversary root
    nodes.forEach(n => {
      if (n.type !== "ADVERSARY") {
        edges.push({
          from: strategic.adversaryId,
          to: n.id,
          relation: "ASSOCIATED_WITH"
        });
      }
    });

    // Lineage transitions (e.g., epoch1 -> epoch2)
    strategic.lineageEdges.forEach(edge => {
      const [from, to] = edge.split("->");
      edges.push({
        from,
        to,
        relation: "LINEAGE_TRANSITION"
      });
    });

    // --- Projected vectors ---
    const projectedVectors = Array.from(
      new Set([
        ...strategic.projectedBehaviors,
        ...strategic.operationalDoctrine
      ])
    );

    const map: CivilizationThreatMap = {
      adversaryId,
      nodes,
      edges,
      projectedVectors,
      generatedAt: timestamp
    };

    return {
      adversaryId,
      map,
      timestamp
    };
  }
}
