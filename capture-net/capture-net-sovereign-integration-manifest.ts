// capture-net/capture-net-sovereign-integration-manifest.ts

export interface MeshChannel {
  id: string;
  description: string;
  payload: string[];
  sourceLayer: number;
}

export interface SovereignIntegrationManifest {
  system: "capture-net";
  version: string;
  channels: MeshChannel[];
}

export const CAPTURE_NET_SOVEREIGN_INTEGRATION: SovereignIntegrationManifest = {
  system: "capture-net",
  version: "1.0.0",
  channels: [
    {
      id: "oversight.global",
      description: "Global oversight signal from the overseer crown",
      payload: ["globalThreatLevel", "dominantVectors", "projectedInstability"],
      sourceLayer: 29
    },
    {
      id: "meta.signals",
      description: "High-order meta-signals from layer 28",
      payload: ["vector", "doctrine", "projected"],
      sourceLayer: 28
    },
    {
      id: "cartography.maps",
      description: "Civilization-grade threat maps",
      payload: ["nodes", "edges", "projectedVectors"],
      sourceLayer: 27
    },
    {
      id: "strategic.intel",
      description: "Strategic intelligence objects",
      payload: ["objectives", "campaignArcs", "operationalDoctrine", "projectedBehaviors"],
      sourceLayer: 26
    },
    {
      id: "lineage.graphs",
      description: "Threat lineage graphs",
      payload: ["nodes", "edges", "campaigns"],
      sourceLayer: 25
    },
    {
      id: "patterns.longrange",
      description: "Long-range adversary patterns",
      payload: ["epochs", "longRangeThreatVector"],
      sourceLayer: 24
    },
    {
      id: "adversary.profiles",
      description: "Adversary-level intelligence profiles",
      payload: ["behavioralSignature", "anomalySignature", "entropyIdentity", "escalationStyle"],
      sourceLayer: 23
    }
  ]
};
