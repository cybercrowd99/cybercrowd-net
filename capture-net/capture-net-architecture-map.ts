// capture-net/capture-net-architecture-map.ts

export interface CaptureNetTier {
  name: string;
  layers: number[];
}

export const CAPTURE_NET_ARCHITECTURE: CaptureNetTier[] = [
  { name: "Trap Layers", layers: [1, 2, 3, 4, 5, 6] },
  { name: "Mid-Stack Layers", layers: [7, 8, 9, 10, 11, 12] },
  { name: "Intelligence Layers", layers: [13, 14, 15, 16, 17, 18, 19] },
  { name: "Persistence Layers", layers: [20] },
  { name: "Distribution Layers", layers: [21] },
  { name: "Correlation Layers", layers: [22] },
  { name: "Adversary Layers", layers: [23] },
  { name: "Pattern Layers", layers: [24] },
  { name: "Lineage Layers", layers: [25] },
  { name: "Strategic Layers", layers: [26] },
  { name: "Cartography Layers", layers: [27] },
  { name: "Meta-Signal Layers", layers: [28] },
  { name: "Overseer Crown", layers: [29] }
];

export function getTierByLayer(index: number): string | undefined {
  const tier = CAPTURE_NET_ARCHITECTURE.find((t) => t.layers.includes(index));
  return tier?.name;
}

export function getLayersInTier(name: string): number[] | undefined {
  return CAPTURE_NET_ARCHITECTURE.find((t) => t.name === name)?.layers;
}
