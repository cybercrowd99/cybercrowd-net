/**
 * NET — Connection Terminal
 *
 * NetConnectionTerminal is the NET boundary artifact responsible
 * for receiving the preserved NET connection dispatch and forming
 * the final structural terminal boundary before any downstream
 * subsystem intake.
 *
 * It does not create authority.
 * It does not authenticate identity.
 * It does not authorize access.
 * It does not correlate.
 * It does not route external connections.
 * It does not execute services.
 * It does not modify sovereignty.
 *
 * NetConnectionTerminal does not contain:
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
 * NetConnectionTerminal only contains:
 * - doctrine discriminator
 * - structural status
 * - preserved NET connection dispatch
 * - structural terminal state
 */

import { NetConnectionDispatch } from "./net-connection-dispatch";

export interface NetConnectionTerminal {
  /**
   * Governing NET terminal doctrine.
   */
  doctrine: "Net_ConnectionTerminal";

  /**
   * Structural artifact discriminator.
   */
  status: "NET_CONNECTION_TERMINAL";

  /**
   * Preserved NET connection dispatch.
   * Never enriched.
   * Never identity-bearing.
   * Never interpreted.
   */
  dispatch: NetConnectionDispatch;

  /**
   * Structural terminal state.
   *
   * This is not routing.
   * This is not authority.
   * This is not execution.
   */
  terminalState: "TERMINAL" | "HELD";
}

/**
 * Build NetConnectionTerminal artifact.
 *
 * This function establishes the final NET terminal boundary.
 *
 * It does not:
 * - create authority
 * - authenticate identity
 * - authorize access
 * - route external connections
 * - execute services
 * - enrich continuity
 *
 * NetConnectionTerminal is a passive NET boundary artifact.
 * Its only permitted refinement is structural immutability.
 */
export function buildNetConnectionTerminal(
  dispatch: NetConnectionDispatch
): NetConnectionTerminal {
  const artifact: NetConnectionTerminal = {
    doctrine: "Net_ConnectionTerminal",
    status: "NET_CONNECTION_TERMINAL",

    dispatch,

    terminalState:
      dispatch.dispatchState === "READY"
        ? "TERMINAL"
        : "HELD"
  };

  return Object.freeze(artifact);
}
