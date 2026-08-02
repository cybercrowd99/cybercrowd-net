// capture/hostile_session/strategic_intelligence_synthesizer.ts
// Capture‑Net: Hostile Session Strategic Intelligence Synthesizer Organ

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
    private lineageBuilder: {
      build: (
        adversaryId: string
      ) => Promise<{ lineage: ThreatLineageGraph }>;
    }
  ) {}

  /**
   * Synthesize strategic intelligence from lineage graph.
   */
  async synthesize(adversaryId: string): Promise<StrategicResult> {
    const { lineage } = await this.lineageBuilder.build(adversaryId);
    const timestamp = new Date().toISOString();

    // Objectives = dominant signals across lineage nodes
    const objectives = Array.from(
      new Set(
        lineage.nodes.flatMap(n => n.dominantSignals)
      )
    );

    // Campaign arcs = transition types across lineage edges
    const campaignArcs = lineage.edges.map(e => e.transitionType);

    // Operational doctrine = escalation cycles across nodes
    const operationalDoctrine = Array.from(
      new Set(
        lineage.nodes.flatMap(n => n.escalationCycle)
      )
    );

    // Projected behaviors = transition signals across edges
    const projectedBehaviors = Array.from(
      new Set(
        lineage.edges.flatMap(e => e.transitionSignals)
      )
    );

    const strategic: StrategicIntelligence = {
      adversaryId,
      objectives,
      campaignArcs,
      operationalDoctrine,
      projectedBehaviors,
      lineageNodes: lineage.nodes.map(n => n.nodeId),
      lineageEdges: lineage.edges.map(e => `${e.fromNodeId}->${e.toNodeId}`),
      generatedAt: timestamp
    };

    return {
      adversaryId,
      strategic,
      timestamp
    };
  }
}
