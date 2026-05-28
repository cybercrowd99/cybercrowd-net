// capture-net/hostile-session-adversary-profiler.ts

import { HostileSessionIntelligence } from "./hostile-session-intelligence.types";

interface AdversaryProfile {
  adversaryId: string;
  sessionIds: string[];
  behavioralSignature: string[];
  anomalySignature: string[];
  entropyIdentity: string[];
  escalationStyle: string[];
  threatPersona: string[];
  generatedAt: string;
}

interface ProfilingResult {
  adversaryId: string;
  profile: AdversaryProfile;
  timestamp: string;
}

export class HostileSessionAdversaryProfiler {
  constructor(private correlator: any) {}

  async profile(intel: HostileSessionIntelligence): Promise<ProfilingResult> {
    const correlation = await this.correlator.correlate(intel);
    const timestamp = new Date().toISOString();

    const allSessions = new Set<string>();
    const behavioralSignature = new Set<string>();
    const anomalySignature = new Set<string>();
    const entropyIdentity = new Set<string>();
    const escalationStyle = new Set<string>();

    for (const group of correlation.correlatedGroups) {
      group.sessionIds.forEach((id) => allSessions.add(id));
      group.sharedClusters.forEach((c) => behavioralSignature.add(c));
      group.sharedAnomalies.forEach((a) => anomalySignature.add(a));
      group.sharedEntropyPatterns.forEach((e) => entropyIdentity.add(e));
      group.threatSignature.forEach((t) => escalationStyle.add(t));
    }

    const adversaryId = crypto.randomUUID();

    const profile: AdversaryProfile = {
      adversaryId,
      sessionIds: Array.from(allSessions),
      behavioralSignature: Array.from(behavioralSignature),
      anomalySignature: Array.from(anomalySignature),
      entropyIdentity: Array.from(entropyIdentity),
      escalationStyle: Array.from(escalationStyle),
      threatPersona: [
        ...behavioralSignature,
        ...anomalySignature,
        ...entropyIdentity,
        ...escalationStyle,
      ],
      generatedAt: timestamp,
    };

    return {
      adversaryId,
      profile,
      timestamp,
    };
  }
}
