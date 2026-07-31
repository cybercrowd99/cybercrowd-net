/**
 * CyberCrowd — NET uIDL CORE Handoff Contract
 *
 * ONE JOB:
 * Define the neutral structural contract for moving
 * NET-side uIDL references toward CORE boundaries.
 *
 * uIDL remains:
 * - structural continuity
 * - lineage reference
 * - non-semantic
 * - non-authoritative
 * - non-identity
 *
 * It allows:
 * - NET to declare a controlled handoff boundary
 * - CORE to receive structural lineage references
 * - public/private separation to remain intact
 *
 * It does not:
 * - create identity
 * - interpret humans
 * - infer intent
 * - grant permissions
 * - create authority
 * - calculate value
 * - execute capabilities
 * - expose CORE state
 */


import type {
  NetUIDLReference
} from "./net-uidl-reference";


export type NetUIDLCoreHandoffState =
  | "DECLARED"
  | "READY"
  | "REJECTED"
  | "FAILED";


export interface NetUIDLCoreHandoffContract {

  /**
   * Governing doctrine.
   */
  doctrine:
    "CyberCrowd_NET_UIDL_CORE_HandoffContract";


  /**
   * Structural discriminator.
   */
  status:
    "NET_UIDL_CORE_HANDOFF_CONTRACT";


  /**
   * Declare a neutral NET→CORE uIDL handoff.
   *
   * Never:
   * - interprets identity
   * - interprets intent
   * - creates authority
   */
  handoff(
    reference: NetUIDLReference
  ): Promise<NetUIDLCoreHandoffState>;
}


/**
 * Build NET uIDL CORE handoff contract.
 *
 * Creates structural handoff only.
 *
 * It does not:
 * - route operations
 * - execute services
 * - identify users
 * - expose private CORE systems
 */
export function buildNetUIDLCoreHandoffContract(
  handoffFn: (
    reference: NetUIDLReference
  ) => Promise<NetUIDLCoreHandoffState>
): NetUIDLCoreHandoffContract {

  const contract: NetUIDLCoreHandoffContract = {

    doctrine:
      "CyberCrowd_NET_UIDL_CORE_HandoffContract",

    status:
      "NET_UIDL_CORE_HANDOFF_CONTRACT",

    handoff:
      handoffFn,
  };


  return Object.freeze(contract);
}
