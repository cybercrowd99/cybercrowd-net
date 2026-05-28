// capture-net/hostile-session-meta-signal-emitter.ts

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
    private mapGenerator: { generate: (adversaryId: string) => Promise<{ map: CivilizationThreatMap }> },
    private meshBus: Queue
  ) {}

  async emit(adversaryId: string): Promise<MetaSignalResult> {
    const { map } = await this.mapGenerator.generate(adversaryId);
    const timestamp = new Date().toISOString();

    const doctrine = Array.from(
      new Set(
        map.nodes
          .filter((n) => n.type === "ADVERSARY")
          .flatMap((n) => n.signals)
      )
    );

    const projected = Array.from(new Set(map.projectedVectors));

    const vector = Array.from(
      new Set([
        ...doctrine,
        ...projected,
        ...map.nodes.flatMap((n) => n.signals),
      ])
    );

    const meta: MetaSignal = {
      adversaryId,
      vector,
      doctrine,
      projected,
      timestamp,
    };

    await this.meshBus.send(meta);

    return {
      adversaryId,
      emitted: meta,
      timestamp,
    };
  }
}
