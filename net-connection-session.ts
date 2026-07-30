/**
 * NET — Connection Session
 *
 * NetConnectionSession is the NET boundary artifact responsible
 * for receiving the established NET surface boundary and preserving
 * the structural session handoff before NET service handling.
 *
 * It does not create authority.
 * It does not authenticate identity.
 * It does not authorize access.
 * It does not correlate.
 * It does not route connections.
 * It does not execute services.
 * It does not modify sovereignty.
 *
 * NetConnectionSession does not contain:
 * - identity
 * - correlation
 * - behavior inference
 * - surveillance
 * - prediction
 * - authority
 * - routing directives
 * - execution state
 * - service results
 *
 * NetConnectionSession only contains:
 * - doctrine discriminator
 * - structural status
 * - preserved NET connection surface
 * - structural session state
 */

import { NetConnectionSurface } from "./net-connection-surface";

export interface NetConnectionSession {
  /**
   * Governing NET session doctrine.
   */
  doctrine: "Net_ConnectionSession";

  /**
   * Structural artifact discriminator.
   */
  status: "NET_CONNECTION_SESSION";

  /**
   * Preserved NET connection surface.
   * Never enriched.
   * Never identity-bearing.
   * Never interpreted.
   */
  surface: NetConnectionSurface;

  /**
   * Structural session state.
   *
   * This is not authentication.
   * This is not authorization.
   * This is not execution.
   */
  sessionState: "OPEN" | "HELD";
}

/**
 * Build NetConnectionSession artifact.
 *
 * This function establishes the NET session boundary.
 *
 * It does not:
 * - create authority
 * - authenticate identity
 * - authorize access
 * - route connections
 * - execute services
 * - enrich continuity
 *
 * NetConnectionSession is a passive NET boundary artifact.
 * Its only permitted refinement is structural immutability.
 */
export function buildNetConnectionSession(
  surface: NetConnectionSurface,
  sessionState: "OPEN" | "HELD"
): NetConnectionSession {
  const artifact: NetConnectionSession = {
    doctrine: "Net_ConnectionSession",
    status: "NET_CONNECTION_SESSION",

    surface,

    sessionState
  };

  return Object.freeze(artifact);
}
