/**
 * CyberCrowd — CORE NET uIDL Organ Gate
 *
 * ONE JOB:
 * Provide a neutral CORE organ gate for anchored
 * NET→CORE uIDL lineage before organ exposure.
 *
 * This is:
 * - structural gating
 * - boundary protection
 * - organ entry control
 *
 * It allows:
 * - CORE to verify structural arrival
 * - organ boundaries to remain isolated
 * - lineage continuity to remain intact
 *
 * It does not:
 * - interpret identity
 * - infer intent
 * - grant permissions
 * - create authority
 * - calculate value
 * - execute capabilities
 * - select user meaning
 * - expose private CORE state
 */


import type {
  NetUIDLReference
} from "./net-uidl-reference";


export type CoreNetUIDLOrganGateState =
  | "GATED"
  | "RELEASED"
  | "REJECTED"
  | "FAILED";


export interface CoreNetUIDLOrganGate {

  /**
   * Governing doctrine.
   */
  doctrine:
    "CyberCrowd_CoreNetUIDLOrganGate";


  /**
   * Structural discriminator.
   */
  status:
    "CORE_NET_UIDL_ORGAN_GATE";


  /**
   * Gate an anchored neutral uIDL reference.
   *
   * Never:
   * - interprets identity
   * - interprets intent
   * - creates authority
   */
  gate(
    reference: NetUIDLReference
  ): Promise<CoreNetUIDLOrganGateState>;
}


/**
 * Build CORE NET uIDL organ gate.
 *
 * Creates structural gating only.
 *
 * It does not:
 * - activate identity
 * - execute operations
 * - expose CORE internals
 */
export function buildCoreNetUIDLOrganGate(
  gateFn: (
    reference: NetUIDLReference
  ) => Promise<CoreNetUIDLOrganGateState>
): CoreNetUIDLOrganGate {

  const organ: CoreNetUIDLOrganGate = {

    doctrine:
      "CyberCrowd_CoreNetUIDLOrganGate",

    status:
      "CORE_NET_UIDL_ORGAN_GATE",

    gate:
      gateFn,
  };


  return Object.freeze(organ);
}
