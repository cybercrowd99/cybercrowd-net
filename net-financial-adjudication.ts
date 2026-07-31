/**
 * NET — Financial Surface Adjudication
 *
 * The NET Financial Surface Adjudication provides bounded structural
 * evaluation for the NET financial surface presentation.
 *
 * It does not:
 * - approve financial activity
 * - authorize ownership
 * - control accounts
 * - validate transactions
 * - identify people
 * - create identity authority
 * - become financial governance
 *
 * Adjudication only:
 * - evaluates structural compatibility
 * - preserves constitutional rules
 * - validates presentation integrity
 * - maintains sovereignty boundaries
 */

import { NetFinancialSurface } from "./net-financial-surface";

/**
 * Structural NET adjudication decisions.
 */
export type NetFinancialAdjudicationDecision =
  | "ACCEPTED"
  | "REVIEW"
  | "REJECTED";

/**
 * Structural NET adjudication reasons.
 */
export type NetFinancialAdjudicationReason =
  | "SURFACE_VALID"
  | "MISSING_SURFACE"
  | "INVALID_SURFACE"
  | "DOCTRINE_MISMATCH";

/**
 * NET Financial Surface Adjudication artifact.
 */
export interface NetFinancialAdjudication {
  /**
   * Constitutional attachment.
   */
  readonly doctrine: "CCF_Constitution_Attachment";

  /**
   * Artifact discriminator.
   */
  readonly status: "NET_FINANCIAL_ADJUDICATION";

  /**
   * Preserved NET financial surface reference.
   */
  readonly surface: NetFinancialSurface;

  /**
   * Structural evaluation decision.
   */
  readonly decision: NetFinancialAdjudicationDecision;

  /**
   * Structural evaluation reason.
   */
  readonly reason: NetFinancialAdjudicationReason;
}

/**
 * Build NET Financial Surface Adjudication.
 *
 * Pure structural evaluation.
 */
export function buildNetFinancialAdjudication(
  surface: NetFinancialSurface,
  decision: NetFinancialAdjudicationDecision,
  reason: NetFinancialAdjudicationReason
): NetFinancialAdjudication {
  const artifact: NetFinancialAdjudication = {
    doctrine: "CCF_Constitution_Attachment",

    status: "NET_FINANCIAL_ADJUDICATION",

    surface,

    decision,

    reason,
  };

  return Object.freeze(artifact);
}
