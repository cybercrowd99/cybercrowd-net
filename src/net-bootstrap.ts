// src/net-bootstrap.ts
//
// CyberCrowd Net Bootstrap
//
// ONE JOB:
// Load the CyberCrowd-net binding adapters in the exact binding order.
//
// No fake import paths.
// No mystery folders.
// No swallowing core logic.

import type { CyberCrowdNetBindingAdapter } from "./cybercrowd-net-binding-chain";

export interface CyberCrowdNetBootstrapAdapters {
  projectEnvelopeAdapter: CyberCrowdNetBindingAdapter;
  syncManagerAdapter: CyberCrowdNetBindingAdapter;
  caseAdapter: CyberCrowdNetBindingAdapter;
  caseExitAdapter: CyberCrowdNetBindingAdapter;
  caseAnalysisAdapter: CyberCrowdNetBindingAdapter;
  lanternfishArchiveAdapter: CyberCrowdNetBindingAdapter;
  decchamberBlackBoxAdapter: CyberCrowdNetBindingAdapter;
  flightControlAdapter: CyberCrowdNetBindingAdapter;
  caseHealthAdapter: CyberCrowdNetBindingAdapter;
}

export function loadCyberCrowdNetAdapters(
  adapters: CyberCrowdNetBootstrapAdapters
): CyberCrowdNetBindingAdapter[] {
  return [
    adapters.projectEnvelopeAdapter,
    adapters.syncManagerAdapter,
    adapters.caseAdapter,
    adapters.caseExitAdapter,
    adapters.caseAnalysisAdapter,
    adapters.lanternfishArchiveAdapter,
    adapters.decchamberBlackBoxAdapter,
    adapters.flightControlAdapter,
    adapters.caseHealthAdapter
  ];
}

export function validateCyberCrowdNetAdapters(
  adapters: Partial<CyberCrowdNetBootstrapAdapters>
): {
  ok: boolean;
  missing: string[];
} {
  const missing: string[] = [];

  if (!adapters.projectEnvelopeAdapter) missing.push("projectEnvelopeAdapter");
  if (!adapters.syncManagerAdapter) missing.push("syncManagerAdapter");
  if (!adapters.caseAdapter) missing.push("caseAdapter");
  if (!adapters.caseExitAdapter) missing.push("caseExitAdapter");
  if (!adapters.caseAnalysisAdapter) missing.push("caseAnalysisAdapter");
  if (!adapters.lanternfishArchiveAdapter) missing.push("lanternfishArchiveAdapter");
  if (!adapters.decchamberBlackBoxAdapter) missing.push("decchamberBlackBoxAdapter");
  if (!adapters.flightControlAdapter) missing.push("flightControlAdapter");
  if (!adapters.caseHealthAdapter) missing.push("caseHealthAdapter");

  return {
    ok: missing.length === 0,
    missing
  };
}
