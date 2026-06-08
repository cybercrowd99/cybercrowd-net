// capture/hostile_session/overseer.ts
// Capture‑Net: Hostile Session Overseer Organ

interface OversightSignal {
  globalThreatLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  dominantVectors: string[];
  projectedInstability: string[];
  lineageDrivers: string[];
  doctrineSummary: string[];
  timestamp: string;
}

interface OversightResult {
  signal: OversightSignal;
  timestamp: string;
}

interface MetaSignal {
  vector: string[];
  doctrine: string[];
  projected: string[];
}

interface CivilizationThreatMap {
  projectedVectors: string[];
  nodes: { id: string; type: string; signals: string[] }[];
}

interface StrategicIntelligence {
  objectives: string[];
  campaignArcs: string[];
  operationalDoctrine: string[];
  projectedBehaviors: string[];
}

interface ThreatLineageGraph {
  nodes: { dominantSignals: string[]; escalationCycle: string[] }[];
}

export class HostileSessionOverseer {
  constructor(
    private metaEmitter: {
      emit: (id: string) => Promise<{ emitted: MetaSignal }>;
    },
    private mapGen: {
      generate: (id: string) => Promise<{ map: CivilizationThreatMap }>;
    },
    private strategic: {
      synthesize: (id: string) => Promise<{ strategic: StrategicIntelligence }>;
    },
    private lineage: {
      build: (id: string) => Promise<{ lineage: ThreatLineageGraph }>;
    }
  ) {}

  /**
   * Oversee adversary-scale synthesis across meta-signal, threat map,
   * strategic intelligence, and lineage graph.
   */
  async oversee(adversaryId: string): Promise<OversightResult> {
    const meta = (await this.metaEmitter.emit(adversaryId)).emitted;
    const map = (await this.mapGen.generate(adversaryId)).map;
    const strat = (await this.strategic.synthesize(adversaryId)).strategic;
    const lin = (await this.lineage.build(adversaryId)).lineage;

    const timestamp = new Date().toISOString();

    // Dominant vectors = meta + projected map vectors + strategic doctrine
    const dominantVectors = Array.from(
      new Set([
        ...meta.vector,
        ...map.projectedVectors,
        ...strat.operationalDoctrine
      ])
    );

    // Projected instability = meta projected + strategic projected behaviors
    const projectedInstability = Array.from(
      new Set([
        ...meta.projected,
        ...strat.projectedBehaviors
      ])
    );

    // Lineage drivers = dominant signals + escalation cycles across lineage nodes
    const lineageDrivers = Array.from(
      new Set(
        lin.nodes.flatMap(n => [
          ...n.dominantSignals,
          ...n.escalationCycle
        ])
      )
    );

    // Doctrine summary = meta doctrine + strategic doctrine
    const doctrineSummary = Array.from(
      new Set([
        ...meta.doctrine,
        ...strat.operationalDoctrine
      ])
    );

    // Global threat level heuristic
    const globalThreatLevel =
      dominantVectors.length > 40 || projectedInstability.length > 25
        ? "CRITICAL"
        : dominantVectors.length > 25
        ? "HIGH"
        : dominantVectors.length > 10
        ? "MEDIUM"
        : "LOW";

    const signal: OversightSignal = {
      globalThreatLevel,
      dominantVectors,
      projectedInstability,
      lineageDrivers,
      doctrineSummary,
      timestamp
    };

    return { signal, timestamp };
  }
}
