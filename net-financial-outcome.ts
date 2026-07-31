/**
 * NET — Financial Surface Outcome
 *
 * The NET Financial Surface Outcome provides a bounded structural
 * disposition layer for the NET financial surface presentation.
 *
 * It does not:
 * - approve financial activity
 * - authorize ownership
 * - identify people
 * - create accounts
 * - record transactions
 * - become a financial ledger
 * - infer behavior
 * - predict outcomes
 *
 * Outcome only:
 * - preserves adjudication results
 * - maintains structural disposition
 * - preserves constitutional context
 * - provides neutral NET awareness
 */

import { NetFinancialSurface } from "./net-financial-surface";
import { NetFinancialAdjudication } from "./net-financial-adjudication";

/**
 * NET Financial Surface Outcome artifact.
 */
export interface NetFinancialOutcome {
  /**
   * Constitutional attachment.
   */
  readonly doctrine: "CCF_Constitution_Attachment";

  /**
   * Artifact discriminator.
   */
  readonly status: "NET_FINANCIAL_OUTCOME";

  /**
   * Preserved NET financial surface reference.
   */
  readonly surface: NetFinancialSurface;

  /**
   * Preserved adjudication reference.
   */
  readonly adjudication: NetFinancialAdjudication;
}

/**
 * Build NET Financial Surface Outcome.
 *
 * Pure structural disposition.
 */
export function buildNetFinancialOutcome(
  surface: NetFinancialSurface,
  adjudication: NetFinancialAdjudication
): NetFinancialOutcome {
  const artifact: NetFinancialOutcome = {
    doctrine: "CCF_Constitution_Attachment",

    status: "NET_FINANCIAL_OUTCOME",

    surface,

    adjudication,
  };

  return Object.freeze(artifact);
}
