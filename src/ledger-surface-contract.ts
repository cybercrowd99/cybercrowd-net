/**
 * CyberCrowd Ledger Surface Contract
 *
 * File:
 * src/ledger-surface-contract.ts
 *
 * Subsystem:
 * CyberLedgerNETSurface
 *
 * Effigy:
 * Structural Ledger Surface Contract
 *
 * Purpose:
 * Defines the NET contract boundary used to formalize approved
 * structural surface adaptation before presentation.
 *
 * Ledger surface contracts preserve:
 * - structural agreement boundaries
 * - continuity-safe adaptation
 * - presentation-safe contracts
 * - subsystem communication integrity
 *
 * Ledger surface contracts do NOT preserve:
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
  LedgerSurfaceAdapter,
} from "./ledger-surface-adapter";

export interface LedgerSurfaceContract {
  /** NET surface subsystem */
  subsystem: "CyberLedgerNETSurface";

  /** Contract state */
  status: "SURFACE_CONTRACT_BOUND";

  /** Connected adapter */
  adapter: LedgerSurfaceAdapter;

  /** Structural contract geometry */
  geometry: unknown;
}

/**
 * Creates a structural ledger surface contract.
 *
 * Formalizes structure.
 * Does not formalize identity.
 * Does not create authority.
 * Does not create decisions.
 */
export function createLedgerSurfaceContract(
  adapter: LedgerSurfaceAdapter
): LedgerSurfaceContract {
  return {
    subsystem: "CyberLedgerNETSurface",
    status: "SURFACE_CONTRACT_BOUND",
    adapter,
    geometry: {
      type: "STRUCTURAL_SURFACE_CONTRACT",
    },
  };
}
