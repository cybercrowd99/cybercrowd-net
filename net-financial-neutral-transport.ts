/**
 * NET — Financial Surface Neutral Transport
 *
 * The NET Financial Surface Neutral Transport provides bounded structural
 * movement for NET financial surface envelopes attached to the CCF
 * constitutional doctrine.
 *
 * It does not:
 * - move money
 * - transfer ownership
 * - authorize transactions
 * - expose financial records
 * - identify people
 * - create identity relationships
 * - perform payment routing
 *
 * Neutral Transport only:
 * - describes presentation movement condition
 * - preserves envelope integrity
 * - maintains constitutional boundaries
 * - prevents semantic enrichment during movement
 */

import { NetFinancialEnvelope } from "./net-financial-envelope";

/**
 * Structural NET transport states.
 */
export type NetFinancialTransportState =
  | "READY"
  | "TRANSFERRED"
  | "REJECTED";

/**
 * NET Financial Surface Neutral Transport artifact.
 */
export interface NetFinancialNeutralTransport {
  /**
   * Constitutional attachment.
   */
  readonly doctrine: "CCF_Constitution_Attachment";

  /**
   * Artifact discriminator.
   */
  readonly status: "NET_FINANCIAL_NEUTRAL_TRANSPORT";

  /**
   * Preserved NET financial envelope.
   */
  readonly envelope: NetFinancialEnvelope;

  /**
   * Structural transport condition.
   */
  readonly state: NetFinancialTransportState;
}

/**
 * Build NET Financial Surface Neutral Transport.
 *
 * Pure structural movement.
 */
export function buildNetFinancialNeutralTransport(
  envelope: NetFinancialEnvelope,
  state: NetFinancialTransportState
): NetFinancialNeutralTransport {
  const artifact: NetFinancialNeutralTransport = {
    doctrine: "CCF_Constitution_Attachment",

    status: "NET_FINANCIAL_NEUTRAL_TRANSPORT",

    envelope,

    state,
  };

  return Object.freeze(artifact);
}
