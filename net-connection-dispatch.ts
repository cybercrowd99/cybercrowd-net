/**
 * NET — Connection Dispatch
 *
 * NetConnectionDispatch is the NET boundary artifact responsible
 * for receiving the preserved NET connection handoff and producing
 * a structurally safe downstream dispatch boundary.
 *
 * It does not create authority.
 * It does not authenticate identity.
 * It does not authorize access.
 * It does not correlate.
 * It does not route external connections.
 * It does not execute services.
 * It does not modify sovereignty.
 *
 * NetConnectionDispatch does not contain:
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
 * NetConnectionDispatch only contains:
 * - doctrine discriminator
 * - structural status
 * - preserved NET connection handoff
 * - structural dispatch state
 */

import { NetConnectionHandoff } from "./net-connection-handoff";

export interface NetConnectionDispatch {
  /**
   * Governing NET dispatch doctrine.
   */
  doctrine: "Net_ConnectionDispatch";

  /**
   * Structural artifact discriminator.
   */
  status: "NET_CONNECTION_DISPATCH";

  /**
   * Preserved NET connection handoff.
   * Never enriched.
   * Never identity-bearing.
   * Never interpreted.
   */
  handoff: NetConnectionHandoff;

  /**
   * Structural dispatch state.
   *
   * This is not routing.
   * This is not authority.
   * This is not execution.
   */
  dispatchState: "READY" | "HELD";
}

/**
 * Build NetConnectionDispatch artifact.
 *
 * This function establishes the NET downstream dispatch boundary.
 *
 * It does not:
 * - create authority
 * - authenticate identity
 * - authorize access
 * - route external connections
 * - execute services
 * - enrich continuity
 *
 * NetConnectionDispatch is a passive NET boundary artifact.
 * Its only permitted refinement is structural immutability.
 */
export function buildNetConnectionDispatch(
  handoff: NetConnectionHandoff
): NetConnectionDispatch {
  const artifact: NetConnectionDispatch = {
    doctrine: "Net_ConnectionDispatch",
    status: "NET_CONNECTION_DISPATCH",

    handoff,

    dispatchState:
      handoff.handoffState === "TRANSFER"
        ? "READY"
        : "HELD"
  };

  return Object.freeze(artifact);
}
