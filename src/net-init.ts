// src/net-init.ts
//
// CyberCrowd Net Initialization Surface
//
// ONE JOB:
// Initialize CyberCrowd-net by loading real adapters, validating them,
// ordering them, binding the chain, and returning one stable snapshot.
//
// No fake paths.
// No swallowing core.
// No hidden logic.
// No magic loaders.

import { CyberCrowdNetBindingChainSurface } from "./cybercrowd-net-binding-chain";
import { CyberCrowdNetCoreAdapters } from "./net-core";
import {
  loadCyberCrowdNetAdapters,
  validateCyberCrowdNetAdapters
} from "./net-bootstrap";

export function initCyberCrowdNet() {
  const validation = validateCyberCrowdNetAdapters(CyberCrowdNetCoreAdapters);

  if (!validation.ok) {
    return {
      ok: false,
      action: "cybercrowd_net_init",
      error: "NET_ADAPTERS_INCOMPLETE",
      missing: validation.missing,
      snapshot: CyberCrowdNetBindingChainSurface.snapshot()
    };
  }

  const orderedAdapters = loadCyberCrowdNetAdapters(CyberCrowdNetCoreAdapters);
  const result = CyberCrowdNetBindingChainSurface.bindChain(orderedAdapters);
  const snapshot = CyberCrowdNetBindingChainSurface.snapshot();

  return {
    ok: result.ok,
    action: "cybercrowd_net_init",
    error: result.error ?? null,
    state: result.state,
    bindings: result.bindings,
    bound: result.bound,
    blocked: result.blocked,
    waiting: result.waiting,
    context: snapshot.context,
    chain_complete: snapshot.chain_complete,
    stable: snapshot.stable
  };
}

export function resetCyberCrowdNetInit() {
  CyberCrowdNetBindingChainSurface.reset();

  return {
    ok: true,
    action: "cybercrowd_net_reset",
    snapshot: CyberCrowdNetBindingChainSurface.snapshot()
  };
}

export function getCyberCrowdNetInitSnapshot() {
  return {
    ok: true,
    action: "cybercrowd_net_snapshot",
    snapshot: CyberCrowdNetBindingChainSurface.snapshot()
  };
}
