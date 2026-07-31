/**
 * CyberCrowd — CORE NET uIDL Receipt Router
 *
 * ONE JOB:
 * Route a neutral CORE-side uIDL handoff receipt
 * toward the correct CORE boundary without interpreting
 * identity, intent, permissions, authority, value,
 * or meaning.
 *
 * This is:
 * - structural routing
 * - receipt movement control
 * - boundary preservation
 *
 * It allows:
 * - CORE to move held uIDL receipts safely
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
 * - expose private CORE state
 */


import type {
  NetUIDLReference
} from "./net-uidl-reference";


export type CoreNetUIDLReceiptRouterState =
  | "ROUTED"
  | "HELD"
  | "REJECTED"
  | "FAILED";


export interface CoreNetUIDLReceiptRouter {

  /**
   * Governing doctrine.
   */
  doctrine:
    "CyberCrowd_CoreNetUIDLReceiptRouter";


  /**
   * Structural discriminator.
   */
  status:
    "CORE_NET_UIDL_RECEIPT_ROUTER";


  /**
   * Route a held uIDL receipt.
   *
   * Never:
   * - interprets identity
   * - interprets intent
   * - creates authority
   */
  routeReceipt(
    reference: NetUIDLReference
  ): Promise<CoreNetUIDLReceiptRouterState>;
}


/**
 * Build CORE NET uIDL receipt router.
 *
 * Creates structural receipt routing only.
 *
 * It does not:
 * - activate identity
 * - execute operations
 * - select permissions
 * - expose private CORE systems
 */
export function buildCoreNetUIDLReceiptRouter(
  routeFn: (
    reference: NetUIDLReference
  ) => Promise<CoreNetUIDLReceiptRouterState>
): CoreNetUIDLReceiptRouter {

  const organ: CoreNetUIDLReceiptRouter = {

    doctrine:
      "CyberCrowd_CoreNetUIDLReceiptRouter",

    status:
      "CORE_NET_UIDL_RECEIPT_ROUTER",

    routeReceipt:
      routeFn,
  };


  return Object.freeze(organ);
}
