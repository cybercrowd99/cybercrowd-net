/**
 * NET — Connection Handoff
 *
 * NetConnectionHandoff is the NET boundary artifact responsible
 * for receiving the preserved NET connection session and producing
 * a structurally safe downstream handoff boundary.
 *
 * It does not create authority.
 * It does not authenticate identity.
 * It does not authorize access.
 * It does not correlate.
 * It does not route connections.
 * It does not execute services.
 * It does not modify sovereignty.
 *
 * NetConnectionHandoff does not contain:
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
 * NetConnectionHandoff only contains:
 * - doctrine discriminator
 * - structural status
 * - preserved NET connection session
 * - structural handoff state
 */

import { NetConnectionSession } from "./net-connection-session";

export interface NetConnectionHandoff {
  /**
   * Governing NET handoff doctrine.
   */
  doctrine: "Net_ConnectionHandoff";

  /**
   * Structural artifact discriminator.
   */
  status: "NET_CONNECTION_HANDOFF";

  /**
   * Preserved NET connection session.
   * Never enriched.
   * Never identity-bearing.
   * Never interpreted.
   */
  session: NetConnectionSession;

  /**
   * Structural handoff state.
   *
   * This is not authentication.
   * This is not authorization.
   * This is not execution.
   */
  handoffState: "TRANSFER" | "HELD";
}

/**
 * Build NetConnectionHandoff artifact.
 *
 * This function establishes the NET → downstream handoff boundary.
 *
 * It does not:
 * - create authority
 * - authenticate identity
 * - authorize access
 * - route connections
 * - execute services
 * - enrich continuity
 *
 * NetConnectionHandoff is a passive NET boundary artifact.
 * Its only permitted refinement is structural immutability.
 */
export function buildNetConnectionHandoff(
  session: NetConnectionSession
): NetConnectionHandoff {
  const artifact: NetConnectionHandoff = {
    doctrine: "Net_ConnectionHandoff",
    status: "NET_CONNECTION_HANDOFF",

    session,

    handoffState:
      session.sessionState === "OPEN"
        ? "TRANSFER"
        : "HELD"
  };

  return Object.freeze(artifact);
}
