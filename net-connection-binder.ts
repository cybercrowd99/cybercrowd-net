/**
 * NET — Connection Binder
 *
 * NetConnectionBinder is the NET boundary artifact responsible
 * for receiving an approved structural NET connection activation
 * boundary and binding it into a NET surface handoff.
 *
 * It does not create authority.
 * It does not evaluate identity.
 * It does not correlate.
 * It does not route connections.
 * It does not perform surveillance.
 * It does not predict behavior.
 *
 * NetConnectionBinder does not contain:
 * - identity
 * - correlation
 * - behavior inference
 * - surveillance
 * - prediction
 * - authority
 * - routing directives
 *
 * NetConnectionBinder only contains:
 * - doctrine discriminator
 * - structural status
 * - preserved NET reactor artifact
 * - NET binding state
 */

import { CoreNetConnectionReactor } from "./core-net-connection-reactor";

export interface NetConnectionBinder {
  /**
   * Governing NET binding doctrine.
   */
  doctrine: "Net_ConnectionBinder";

  /**
   * Structural artifact discriminator.
   */
  status: "NET_CONNECTION_BINDER";

  /**
   * Preserved NET reactor boundary.
   * Never enriched.
   * Never identity-bearing.
   */
  reactor: CoreNetConnectionReactor;

  /**
   * Structural NET binding state.
   *
   * This is not authority.
   * This is not routing.
   * This is not permission.
   */
  bindingState: "BOUND" | "HELD";
}

/**
 * Build NetConnectionBinder artifact.
 *
 * This function binds the NET reactor boundary.
 *
 * It does not:
 * - create authority
 * - route connections
 * - evaluate identity
 * - modify sovereignty
 * - enrich continuity
 * - execute external operations
 *
 * NetConnectionBinder is a passive NET boundary artifact.
 */
export function buildNetConnectionBinder(
  reactor: CoreNetConnectionReactor
): NetConnectionBinder {
  const artifact: NetConnectionBinder = {
    doctrine: "Net_ConnectionBinder",
    status: "NET_CONNECTION_BINDER",

    reactor,

    bindingState:
      reactor.activationState === "CONNECTED"
        ? "BOUND"
        : "HELD"
  };

  return Object.freeze(artifact);
}
