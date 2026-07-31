/**
 * CyberCrowd — CORE NET uIDL Handoff Receipt
 *
 * ONE JOB:
 * Provide a neutral CORE-side receipt membrane for a
 * NET→CORE uIDL handoff artifact before it touches any
 * CORE organ.
 *
 * This is:
 * - a holding boundary
 * - a structural receipt membrane
 * - a pre-organ staging layer
 *
 * It allows:
 * - CORE to hold the uIDL reference without acting on it
 * - lineage continuity to remain intact
 * - organ sovereignty to remain preserved
 *
 * It does not:
 * - bind uIDL
 * - interpret identity
 * - infer intent
 * - grant permissions
 * - create authority
 * - calculate value
 * - route operations
 * - expose private CORE state
 */


import type {
  NetUIDLReference
} from "./net-uidl-reference";


export type CoreNetUIDLHandoffReceiptState =
  | "RECEIVED"
  | "HELD"
  | "REJECTED"
  | "FAILED";


export interface CoreNetUIDLHandoffReceipt {

  /**
   * Governing doctrine.
   */
  doctrine:
    "CyberCrowd_CoreNetUIDLHandoffReceipt";


  /**
   * Structural discriminator.
   */
  status:
    "CORE_NET_UIDL_HANDOFF_RECEIPT";


  /**
   * Hold a neutral NET→CORE uIDL reference.
   *
   * Never:
   * - interprets identity
   * - interprets intent
   * - creates authority
   */
  hold(
    reference: NetUIDLReference
  ): Promise<CoreNetUIDLHandoffReceiptState>;
}


/**
 * Build CORE NET uIDL handoff receipt membrane.
 *
 * Creates structural holding boundary only.
 *
 * It does not:
 * - bind uIDL
 * - execute capabilities
 * - identify users
 * - expose private CORE systems
 */
export function buildCoreNetUIDLHandoffReceipt(
  holdFn: (
    reference: NetUIDLReference
  ) => Promise<CoreNetUIDLHandoffReceiptState>
): CoreNetUIDLHandoffReceipt {

  const membrane: CoreNetUIDLHandoffReceipt = {

    doctrine:
      "CyberCrowd_CoreNetUIDLHandoffReceipt",

    status:
      "CORE_NET_UIDL_HANDOFF_RECEIPT",

    hold:
      holdFn,
  };


  return Object.freeze(membrane);
}
