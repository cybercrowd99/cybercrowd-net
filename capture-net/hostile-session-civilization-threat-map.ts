// capture-net/hostile-session-civilization-threat-map.ts

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

export class HostileSessionCivilizationThreatMapGenerator {
  constructor(
    private strategicSynth: { synthesize: (adversaryId: string) => Promise<{ strategic: StrategicIntelligence }> }
  ) {}

  async generate(adversaryId: string): Promise<ThreatMapResult> {
    const { strategic } = await this.strategicSynth.synthesize(adversaryId);
    const timestamp = new Date().toISOString();

    const nodes: ThreatMapNode[] = [];

    nodes.push({
      id: strategic.adversaryId,
      label: "Adversary",
      type: "ADVERSARY",
      signals: [...strategic.operationalDoctrine],
    });

    strategic.objectives.forEach((o) =>
      nodes.push({
        id: crypto.randomUUID(),
        label: o,
        type: "OBJECTIVE",
        signals: [o],
      })
    );

    strategic.campaignArcs.forEach((c) =>
      nodes.push({
        id: crypto.randomUUID(),
        label: c,
        type: "CAMPAIGN",
        signals: [c],
      })
    );

    strategic.lineageNodes.forEach((ln) =>
      nodes.push({
        id: ln,
        label: `Epoch ${ln}`,
        type: "EPOCH",
        signals: [],
      })
    );

    strategic.projectedBehaviors.forEach((b) =>
      nodes.push({
        id: crypto.randomUUID(),
        label: b,
        type: "BEHAVIOR",
        signals: [b],
      })
    );

    const edges: ThreatMapEdge[] = [];

    nodes.forEach((n) => {
      if (n.type !== "ADVERSARY") {
        edges.push({
          from: strategic.adversaryId,
          to: n.id,
          relation: "ASSOCIATED_WITH",
        });
      }
    });

    strategic.lineageEdges.forEach((edge) => {
      const [from, to] = edge.split("->");
      edges.push({
        from,
        to,
        relation: "LINEAGE_TRANSITION",
      });
    });

    const projectedVectors = Array.from(
      new Set([
        ...strategic.projectedBehaviors,
        ...strategic.operationalDoctrine,
      ])
    );

    const map: CivilizationThreatMap = {
      adversaryId,
      nodes,
      edges,
      projectedVectors,
      generatedAt: timestamp,
    };

    return {
      adversaryId,
      map,
      timestamp,
    };
  }
}
