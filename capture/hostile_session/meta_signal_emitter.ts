// capture/hostile_session/meta_signal_emitter.ts
// Capture‑Net: Hostile Session Meta‑Signal Emitter Organ

interface MetaSignal {
  adversaryId: string;
  vector: string[];
  doctrine: string[];
  projected: string[];
  timestamp: string;
}

interface MetaSignalResult {
  adversaryId: string;
  emitted: MetaSignal;
  timestamp: string;
}

interface CivilizationThreatMap {
  adversaryId: string;
  projectedVectors: string[];
  nodes: { id: string; type: string; signals: string[] }[];
}

export class HostileSessionMetaSignalEmitter {
  constructor(
    private mapGenerator: {
      generate: (
        adversaryId: string
      ) => Promise<{ map: CivilizationThreatMap }>;
    },
    private meshBus: Queue
  ) {}

  /**
   * Emit a meta-signal derived from the civilization threat map.
   */
  async emit(adversaryId: string): Promise<MetaSignalResult> {
    const { map } = await this.mapGenerator.generate(adversaryId);
    const timestamp = new Date().toISOString();

    // Doctrine = signals from adversary nodes
    const doctrine = Array.from(
      new Set(
        map.nodes
          .filter(n => n.type === "ADVERSARY")
          .flatMap(n => n.signals)
      )
    );

    // Projected = projected vectors from the map
    const projected = Array.from(new Set(map.projectedVectors));

    // Vector = doctrine + projected + all node signals
    const vector = Array.from(
      new Set([
        ...doctrine,
        ...projected,
        ...map.nodes.flatMap(n => n.signals)
      ])
    );

    const meta: MetaSignal = {
      adversaryId,
      vector,
      doctrine,
      projected,
      timestamp
    };

    await this.meshBus.send(meta);

    return {
      adversaryId,
      emitted: meta,
      timestamp
    };
  }
}
