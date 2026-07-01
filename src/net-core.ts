// src/net-core.ts
//
// CyberCrowd Net Core Adapter Factory
//
// ONE JOB:
// Wrap REAL CyberCrowd core surface files into CyberCrowdNetBindingAdapters.
//
// No fake paths.
// No mystery loaders.
// No auto-discovery.
// No hidden logic.
// No lying names.

import type { CyberCrowdNetBindingAdapter } from "./cybercrowd-net-binding-chain";

import { CyberCrowdCaseSurface } from "./cybercrowd-case";
import { CyberCrowdCaseHealthSurface } from "./cybercrowd-case-health";

import {
  createCyberCrowdOneTimePass,
  markCyberCrowdOneTimePassSent,
  markCyberCrowdOneTimePassFailed
} from "./cybercrowd-one-time-pass";

import {
  archiveCyberCrowdTurnstilePass
} from "./cybercrowd-turnstile-archive";

function makeObjectAdapter(
  binding_name: CyberCrowdNetBindingAdapter["binding_name"],
  binding_label: string,
  requires: CyberCrowdNetBindingAdapter["requires"],
  output: unknown,
  exposes: string[]
): CyberCrowdNetBindingAdapter {
  return {
    binding_name,
    binding_label,
    can_bind: true,
    exposes,
    requires,
    bind: () => output,
    data: {}
  };
}

function makeMissingAdapter(
  binding_name: CyberCrowdNetBindingAdapter["binding_name"],
  binding_label: string,
  requires: CyberCrowdNetBindingAdapter["requires"],
  exposes: string[] = []
): CyberCrowdNetBindingAdapter {
  return {
    binding_name,
    binding_label,
    can_bind: false,
    exposes,
    requires,
    data: {
      missing: true
    }
  };
}

export const projectEnvelopeAdapter = makeMissingAdapter(
  "project-envelope",
  "Project Envelope",
  []
);

export const syncManagerAdapter = makeMissingAdapter(
  "sync-manager",
  "Sync Manager",
  ["project-envelope"]
);

export const caseAdapter = makeObjectAdapter(
  "case",
  "CASE",
  ["project-envelope", "sync-manager"],
  CyberCrowdCaseSurface,
  [
    "open",
    "update",
    "hold",
    "activate",
    "stall",
    "resolve",
    "release",
    "seal",
    "burn",
    "get",
    "snapshot"
  ]
);

export const caseExitAdapter = makeMissingAdapter(
  "case-exit",
  "CASE EXIT",
  ["case", "sync-manager"]
);

export const caseAnalysisAdapter = makeMissingAdapter(
  "case-analysis",
  "CASE ANALYSIS",
  ["case"]
);

export const lanternfishArchiveAdapter = makeMissingAdapter(
  "lanternfish-archive",
  "Lanternfish Archive",
  ["case", "case-exit", "case-analysis", "sync-manager"]
);

export const decchamberBlackBoxAdapter = makeObjectAdapter(
  "decchamber-black-box",
  "DECchamber Black Box",
  ["sync-manager"],
  {
    archiveCyberCrowdTurnstilePass
  },
  [
    "archiveCyberCrowdTurnstilePass"
  ]
);

export const flightControlAdapter = makeMissingAdapter(
  "flight-control",
  "Flight Control",
  [
    "case",
    "case-exit",
    "case-analysis",
    "sync-manager",
    "lanternfish-archive",
    "decchamber-black-box"
  ]
);

export const caseHealthAdapter = makeObjectAdapter(
  "case-health",
  "CASE HEALTH",
  ["case", "sync-manager"],
  CyberCrowdCaseHealthSurface,
  [
    "check",
    "checkBatch",
    "get",
    "snapshot"
  ]
);

export const oneTimePassAdapter = {
  createCyberCrowdOneTimePass,
  markCyberCrowdOneTimePassSent,
  markCyberCrowdOneTimePassFailed
};

export const CyberCrowdNetCoreAdapters = {
  projectEnvelopeAdapter,
  syncManagerAdapter,
  caseAdapter,
  caseExitAdapter,
  caseAnalysisAdapter,
  lanternfishArchiveAdapter,
  decchamberBlackBoxAdapter,
  flightControlAdapter,
  caseHealthAdapter
};
