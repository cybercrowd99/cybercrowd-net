/**
 * CyberCrowd Ledger Surface Adapter
 *
 * File:
 * src/ledger-surface-adapter.ts
 *
 * Subsystem:
 * CyberLedgerNETSurface
 *
 * Effigy:
 * Structural Ledger Surface Adapter
 *
 * Purpose:
 * Defines the NET adapter boundary used to translate approved
 * CyberLedger structural surfaces into presentation-safe
 * structures without altering ledger continuity.
 *
 * Ledger surface adapters preserve:
 * - structural surface translation
 * - continuity-safe adaptation
 * - presentation boundary separation
 * - subsystem-safe communication
 *
 * Ledger surface adapters do NOT preserve:
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
  LedgerSurfaceBinder,
} from "./ledger-surface-binder";

export interface LedgerSurfaceAdapter {
  /** NET surface subsystem */
  subsystem: "CyberLedgerNETSurface";

  /** Adapter state */
  status: "SURFACE_ADAPTER_CONNECTED";

  /** Connected binder */
  binder: LedgerSurfaceBinder;

  /** Structural adapter geometry */
  geometry: unknown;
}

/**
 * Creates a structural ledger surface adapter.
 *
 * Adapts structure.
 * Does not adapt identity.
 * Does not create authority.
 * Does not create decisions.
 */
export function createLedgerSurfaceAdapter(
  binder: LedgerSurfaceBinder
): LedgerSurfaceAdapter {
  return {
    subsystem: "CyberLedgerNETSurface",
    status: "SURFACE_ADAPTER_CONNECTED",
    binder,
    geometry: {
      type: "STRUCTURAL_SURFACE_ADAPTER",
    },
  };
}
