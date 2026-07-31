/**
 * CyberCrowd — CORE NET uIDL Handoff Receiver
 *
 * ONE JOB:
 * Receive a neutral NET→CORE uIDL handoff artifact
 * at the CORE boundary without interpreting identity,
 * intent, permissions, authority, value, or meaning.
 *
 * It allows:
 * - CORE to acknowledge NET structural handoff
 * - lineage continuity to remain intact
 * - boundary separation to remain sovereign
 *
 * It does not:
 * - create identity
 * - interpret users
 * - infer intent
 * - grant permissions
 * - create authority
 * - calculate value
 * - execute services
 * - expose private CORE state
 */


import type {
  NetUIDLReference
} from "./net-uidl-reference";


export type CoreNetUIDLHandoffReceiverState =
  | "HANDOFF_RECEIVED"
  | "HANDOFF_REJECTED"
  | "FAILED";


export interface CoreNetUIDLHandoffReceiver {

  /**
   * Governing doctrine.
   */
  doctrine:
    "CyberCrowd_CoreNetUIDLHandoffReceiver";


  /**
   * Structural discriminator.
   */
  status:
    "CORE_NET_UIDL_HANDOFF_RECEIVER";


  /**
   * Receive a neutral NET→CORE uIDL handoff.
   *
   * Never:
   * - interprets identity
   * - interprets intent
   * - creates authority
   */
  receiveHandoff(
    reference: NetUIDLReference
  ): Promise<CoreNetUIDLHandoffReceiverState>;
}


/**
 * Build CORE NET uIDL handoff receiver.
 *
 * Creates structural receipt only.
 *
 * It does not:
 * - route operations
 * - execute capabilities
 * - identify users
 * - expose private CORE systems
 */
export function buildCoreNetUIDLHandoffReceiver(
  receiveFn: (
    reference: NetUIDLReference
  ) => Promise<CoreNetUIDLHandoffReceiverState>
): CoreNetUIDLHandoffReceiver {

  const organ: CoreNetUIDLHandoffReceiver = {

    doctrine:
      "CyberCrowd_CoreNetUIDLHandoffReceiver",

    status:
      "CORE_NET_UIDL_HANDOFF_RECEIVER",

    receiveHandoff:
      receiveFn,
  };


  return Object.freeze(organ);
}
