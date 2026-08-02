// capture/hostile_session/threat_lineage_builder.ts
// Capture‑Net: Hostile Session Threat Lineage Builder Organ

interface ThreatLineageNode {
  nodeId: string;
  epochId: string;
  sessionIds: string[];
  dominantSignals: string[];
  entropyDrift: number;
  escalationCycle: string[];
  timestampRange: { start: string; end: string };
}

interface ThreatLineageEdge {
  fromNodeId: string;
  toNodeId: string;
  transitionSignals: string[];
  transitionType: "ESCALATION" | "DEESCALATION" | "TACTIC_SHIFT" | "IDLE_GAP";
}

interface ThreatLineageGraph {
  adversaryId: string;
  nodes: ThreatLineageNode[];
  edges: ThreatLineageEdge[];
  campaigns: {
    campaignId: string;
    nodeIds: string[];
    label: string;
  }[];
  generatedAt: string;
}

interface LineageResult {
  adversaryId: string;
  lineage: ThreatLineageGraph;
  timestamp: string;
}

interface LongRangePatternEpoch {
  epochId: string;
  sessionIds: string[];
  dominantSignals: string[];
  entropyDrift: number;
  escalationCycle: string[];
  timestampRange: { start: string; end: string };
}

interface LongRangePattern {
  adversaryId: string;
  epochs: LongRangePatternEpoch[];
  longRangeThreatVector: string[];
  generatedAt: string;
}

export class HostileSessionThreatLineageBuilder {
  constructor(
    private patternEngine: {
      analyze: (
        adversaryId: string
      ) => Promise<{ pattern: LongRangePattern }>;
    }
  ) {}

  /**
   * Build a lineage graph from long-range pattern epochs.
   */
  async build(adversaryId: string): Promise<LineageResult> {
    const { pattern } = await this.patternEngine.analyze(adversaryId);
    const timestamp = new Date().toISOString();

    // Convert epochs → lineage nodes
    const nodes: ThreatLineageNode[] = pattern.epochs.map(epoch => ({
      nodeId: epoch.epochId,
      epochId: epoch.epochId,
      sessionIds: epoch.sessionIds,
      dominantSignals: epoch.dominantSignals,
      entropyDrift: epoch.entropyDrift,
      escalationCycle: epoch.escalationCycle,
      timestampRange: epoch.timestampRange
    }));

    // Build edges between sequential nodes
    const edges: ThreatLineageEdge[] = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      const current = nodes[i];
      const next = nodes[i + 1];

      const transitionSignals = Array.from(
        new Set([
          ...current.dominantSignals,
          ...next.dominantSignals
        ])
      );

      const transitionType: ThreatLineageEdge["transitionType"] =
        next.entropyDrift > current.entropyDrift
          ? "ESCALATION"
          : next.entropyDrift < current.entropyDrift
          ? "DEESCALATION"
          : "TACTIC_SHIFT";

      edges.push({
        fromNodeId: current.nodeId,
        toNodeId: next.nodeId,
        transitionSignals,
        transitionType
      });
    }

    // Campaign grouping (simple primary campaign)
    const campaigns: ThreatLineageGraph["campaigns"] = [];
    if (nodes.length) {
      campaigns.push({
        campaignId: crypto.randomUUID(),
        nodeIds: nodes.map(n => n.nodeId),
        label: "Primary adversary campaign"
      });
    }

    const lineage: ThreatLineageGraph = {
      adversaryId,
      nodes,
      edges,
      campaigns,
      generatedAt: timestamp
    };

    return {
      adversaryId,
      lineage,
      timestamp
    };
  }
}
