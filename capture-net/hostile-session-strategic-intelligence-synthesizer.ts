// capture-net/hostile-session-strategic-intelligence-synthesizer.ts

interface StrategicIntelligence {
  adversaryId: string;
  objectives: string[];
  campaignArcs: string[];
  operationalDoctrine: string[];
  projectedBehaviors: string[];
  lineageNodes: string[];
  lineageEdges: string[];
  generatedAt: string;
}

interface StrategicResult {
  adversaryId: string;
  strategic: StrategicIntelligence;
  timestamp: string;
}

interface ThreatLineageGraph {
  adversaryId: string;
  nodes: {
    nodeId: string;
    dominantSignals: string[];
    escalationCycle: string[];
    entropyDrift: number;
  }[];
  edges: {
    fromNodeId: string;
    toNodeId: string;
    transitionSignals: string[];
    transitionType: string;
  }[];
}

export class HostileSessionStrategicIntelligenceSynthesizer {
  constructor(
    private lineageBuilder: { build: (adversaryId: string) => Promise<{ lineage: ThreatLineageGraph }> }
  ) {}

  async synthesize(adversaryId: string): Promise<StrategicResult> {
    const { lineage } = await this.lineageBuilder.build(adversaryId);
    const timestamp = new Date().toISOString();

    const objectives = Array.from(
      new Set(
        lineage.nodes.flatMap((n) => n.dominantSignals)
      )
    );

    const campaignArcs = lineage.edges.map((e) => e.transitionType);

    const operationalDoctrine = Array.from(
      new Set(
        lineage.nodes.flatMap((n) => n.escalationCycle)
      )
    );

    const projectedBehaviors = Array.from(
      new Set(
        lineage.edges.flatMap((e) => e.transitionSignals)
      )
    );

    const strategic: StrategicIntelligence = {
      adversaryId,
      objectives,
      campaignArcs,
      operationalDoctrine,
      projectedBehaviors,
      lineageNodes: lineage.nodes.map((n) => n.nodeId),
      lineageEdges: lineage.edges.map((e) => `${e.fromNodeId}->${e.toNodeId}`),
      generatedAt: timestamp,
    };

    return {
      adversaryId,
      strategic,
      timestamp,
    };
  }
}
