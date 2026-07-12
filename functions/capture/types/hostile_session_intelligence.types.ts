/**
 * NET FILE: functions/capture/types/hostile_session_intelligence.types.ts
 * Repository: cybercrowd99/cybercrowd-net
 * CyberCrowd | Hostile Session Intelligence Shared Contract
 *
 * Purpose:
 * Preserve the shared hostile-session intelligence package consumed by
 * intelligence_export.ts and intelligence_distributor.ts.
 *
 * Owns:
 * HostileSessionIntelligencePackage, hostile confidence dimensions,
 * hostile signal factors, behavioral-cluster lineage, operator view,
 * machine view, and the intelligence package structure.
 *
 * Does NOT own:
 * Hostile-session detection, intelligence generation, threat calculation,
 * D1/KV/R2 export, Queue distribution, dashboard delivery, or automation.
 */

export type HostileSessionIntelligencePrimitive =
  | string
  | number
  | boolean
  | null;

export type HostileSessionIntelligenceValue =
  | HostileSessionIntelligencePrimitive
  | HostileSessionIntelligenceObject
  | HostileSessionIntelligenceValue[];

export interface HostileSessionIntelligenceObject {
  [key: string]: HostileSessionIntelligenceValue;
}

export interface HostileSessionConfidence {
  hostility: number;
  automationLikelihood: number;
  lateralMovementIntent: number;
  dataExfilIntent: number;
  persistenceIntent: number;
}

export interface HostileSessionFactors {
  dominantSignals: HostileSessionIntelligenceValue[];
  supportingSignals: HostileSessionIntelligenceValue[];
  mitigatingSignals: HostileSessionIntelligenceValue[];
}

export interface HostileSessionBehavioralClusters {
  archetypeTags: string[];
}

export interface HostileSessionIntelligenceUpstream {
  behavioralClusters?: HostileSessionBehavioralClusters;
}

export interface HostileSessionIntelligence {
  sessionId: string;
  threatScore: number;
  threatLevel: string;
  confidence: HostileSessionConfidence;
  factors: HostileSessionFactors;
  upstream?: HostileSessionIntelligenceUpstream;
  generatedAt: string;
}

export type HostileSessionOperatorView =
  HostileSessionIntelligenceObject;

export type HostileSessionMachineView =
  HostileSessionIntelligenceObject;

export interface HostileSessionIntelligencePackage {
  intelligence: HostileSessionIntelligence;
  operatorView: HostileSessionOperatorView;
  machineView: HostileSessionMachineView;
}
