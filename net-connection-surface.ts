/**
 * NET — Connection Surface
 *
 * NetConnectionSurface is the NET boundary artifact responsible
 * for receiving the bound NET connection artifact and establishing
 * the final structural surface handoff boundary.
 *
 * It does not create authority.
 * It does not evaluate identity.
 * It does not correlate.
 * It does not route connections.
 * It does not perform surveillance.
 * It does not predict behavior.
 * It does not execute external operations.
 *
 * NetConnectionSurface does not contain:
 * - identity
 * - correlation
 * - behavior inference
 * - surveillance
 * - prediction
 * - authority
 * - routing directives
 * - execution state
 *
 * NetConnectionSurface only contains:
 * - doctrine discriminator
 * - structural status
 * - preserved NET connection binder
 * - surface binding state
 */

import { NetConnectionBinder } from "./net-connection-binder";

export interface NetConnectionSurface {
  /**
   * Governing NET surface doctrine.
   */
  doctrine: "Net_ConnectionSurface";

  /**
   * Structural artifact discriminator.
   */
  status: "NET_CONNECTION_SURFACE";

  /**
   * Preserved NET connection binder.
   * Never enriched.
   * Never identity-bearing.
   * Never interpreted.
   */
  binder: NetConnectionBinder;

  /**
   * Structural surface state.
   *
   * This is not authority.
   * This is not routing.
   * This is not execution.
   */
  surfaceState: "ACTIVE" | "HELD";
}

/**
 * Build NetConnectionSurface artifact.
 *
 * This function establishes the NET surface boundary.
 *
 * It does not:
 * - create authority
 * - route connections
 * - evaluate identity
 * - modify sovereignty
 * - enrich continuity
 * - execute operations
 *
 * NetConnectionSurface is a passive NET boundary artifact.
 * Its only permitted refinement is structural immutability.
 */
export function buildNetConnectionSurface(
  binder: NetConnectionBinder,
  surfaceState: "ACTIVE" | "HELD"
): NetConnectionSurface {
  const artifact: NetConnectionSurface = {
    doctrine: "Net_ConnectionSurface",
    status: "NET_CONNECTION_SURFACE",

    binder,

    surfaceState
  };

  return Object.freeze(artifact);
}
