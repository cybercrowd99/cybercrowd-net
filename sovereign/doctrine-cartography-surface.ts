// sovereign/doctrine-cartography-surface.ts

import { DoctrineLayer } from "./doctrine-layer";
import { SovereignHarmonicsEngine } from "./sovereign-harmonics-engine";

export interface CartographicNode {
  id: string;
  type: "VECTOR" | "BLOCK" | "HARMONIC";
  coordinates: { x: number; y: number };
  metadata: any;
}

export interface CartographicMap {
  nodes: CartographicNode[];
  timestamp: string;
}

export class DoctrineCartographySurface {
  private doctrine = new DoctrineLayer();
  private harmonics = new SovereignHarmonicsEngine();

  private randomCoord() {
    return Math.floor(Math.random() * 100) - 50;
  }

  generateMap(): CartographicMap {
    const timestamp = new Date().toISOString();

    const vectorNodes = this.doctrine.getDoctrineVectors().map((v) => ({
      id: `map.vector.${v.id}`,
      type: "VECTOR" as const,
      coordinates: { x: this.randomCoord(), y: this.randomCoord() },
      metadata: v
    }));

    const blockNodes = this.doctrine.getContradictionBlocks().map((b) => ({
      id: `map.block.${b.id}`,
      type: "BLOCK" as const,
      coordinates: { x: this.randomCoord(), y: this.randomCoord() },
      metadata: b
    }));

    const harmonicNodes = this.harmonics.computeUnifiedField().map((h) => ({
      id: `map.harmonic.${h.id}`,
      type: "HARMONIC" as const,
      coordinates: { x: this.randomCoord(), y: this.randomCoord() },
      metadata: h
    }));

    return {
      nodes: [...vectorNodes, ...blockNodes, ...harmonicNodes],
      timestamp
    };
  }
}
