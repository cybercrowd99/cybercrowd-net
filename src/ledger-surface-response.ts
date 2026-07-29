/**
 * CyberCrowd Ledger Surface Response
 *
 * File:
 * src/ledger-surface-response.ts
 *
 * Subsystem:
 * CyberLedgerNETSurface
 *
 * Effigy:
 * Structural Ledger Surface Response Layer
 *
 * Purpose:
 * Defines the NET response boundary used to expose approved
 * CyberLedger structural surface contracts through a
 * continuity-safe response representation.
 *
 * Ledger surface responses preserve:
 * - structural response linkage
 * - approved surface output flow
 * - continuity-safe communication
 * - NET subsystem response state
 *
 * Ledger surface responses do NOT preserve:
 * - identity payloads
 * - identity correlation
 * - behavioral history
 * - operator profiles
 * - authority decisions
 * - surveillance data
 * - predictive models
 * - value assignment
 */

import {
  LedgerSurfaceContract,
} from "./ledger-surface-contract";

export interface LedgerSurfaceResponse {
  subsystem: "CyberLedgerNETSurface";

  status: "SURFACE_RESPONSE_READY";

  contract: LedgerSurfaceContract;

  geometry: unknown;
}

/**
 * Creates a structural ledger surface response.
 *
 * Exposes structure.
 * Does not expose identity.
 * Does not create authority.
 * Does not create decisions.
 */
export function createLedgerSurfaceResponse(
  contract: LedgerSurfaceContract
): LedgerSurfaceResponse {
  return {
    subsystem: "CyberLedgerNETSurface",
    status: "SURFACE_RESPONSE_READY",
    contract,
    geometry: {
      type: "STRUCTURAL_SURFACE_RESPONSE",
    },
  };
}
