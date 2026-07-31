/**
 * NET — Financial Surface Context
 *
 * The NET Financial Surface Context provides bounded structural
 * awareness for the NET financial surface presentation.
 *
 * It does not:
 * - store financial information
 * - contain identity
 * - store accounts
 * - store balances
 * - record transactions
 * - execute payments
 * - create user profiles
 * - perform financial interpretation
 *
 * Context only:
 * - describes NET surface placement
 * - preserves neutral presentation awareness
 * - maintains constitutional separation
 * - supports NET structural understanding
 */

import { NetFinancialSurface } from "./net-financial-surface";

/**
 * NET Financial Surface Context artifact.
 */
export interface NetFinancialContext {
  /**
   * Constitutional attachment.
   */
  readonly doctrine: "CCF_Constitution_Attachment";

  /**
   * Artifact discriminator.
   */
  readonly status: "NET_FINANCIAL_CONTEXT";

  /**
   * Preserved NET financial surface reference.
   */
  readonly surface: NetFinancialSurface;

  /**
   * Neutral structural context label.
   */
  readonly context: string;
}

/**
 * Build NET Financial Surface Context.
 *
 * Pure structural awareness.
 */
export function buildNetFinancialContext(
  surface: NetFinancialSurface,
  context: string
): NetFinancialContext {
  const artifact: NetFinancialContext = {
    doctrine: "CCF_Constitution_Attachment",

    status: "NET_FINANCIAL_CONTEXT",

    surface,

    context,
  };

  return Object.freeze(artifact);
}
