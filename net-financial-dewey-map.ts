/**
 * NET — Financial Surface Dewey Map
 *
 * The NET Financial Surface Dewey Map provides bounded structural
 * organization for the NET financial surface presentation.
 *
 * It does not:
 * - store money
 * - represent ownership
 * - identify people
 * - record transactions
 * - create financial history
 * - become a ledger
 * - perform financial interpretation
 *
 * Dewey Map only:
 * - classifies NET financial surface structure
 * - preserves neutral organization
 * - maintains constitutional context
 * - supports bounded presentation navigation
 */

import { NetFinancialSurface } from "./net-financial-surface";

/**
 * Structural Dewey classification node.
 *
 * Path and label contain no financial meaning.
 */
export interface NetFinancialDeweyNode {
  /**
   * Neutral structural path.
   */
  readonly path: string;

  /**
   * Neutral structural label.
   */
  readonly label: string;
}

/**
 * NET Financial Surface Dewey Map artifact.
 */
export interface NetFinancialDeweyMap {
  /**
   * Constitutional attachment.
   */
  readonly doctrine: "CCF_Constitution_Attachment";

  /**
   * Artifact discriminator.
   */
  readonly status: "NET_FINANCIAL_DEWEY_MAP";

  /**
   * Preserved NET financial surface reference.
   */
  readonly surface: NetFinancialSurface;

  /**
   * Immutable structural classification.
   */
  readonly nodes: ReadonlyArray<NetFinancialDeweyNode>;
}

/**
 * Build NET Financial Surface Dewey Map.
 *
 * Pure structural organization.
 */
export function buildNetFinancialDeweyMap(
  surface: NetFinancialSurface,
  nodes: ReadonlyArray<NetFinancialDeweyNode>
): NetFinancialDeweyMap {
  return Object.freeze({
    doctrine: "CCF_Constitution_Attachment",

    status: "NET_FINANCIAL_DEWEY_MAP",

    surface,

    nodes: Object.freeze([...nodes]),
  });
}
