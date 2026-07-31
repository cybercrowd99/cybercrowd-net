/**
 * NET — Financial Surface Qualifiers
 *
 * The NET Financial Surface Qualifiers provide bounded structural
 * descriptors for the NET financial surface presentation.
 *
 * They do not:
 * - store money
 * - represent ownership
 * - identify people
 * - record transactions
 * - validate financial activity
 * - infer behavior
 * - become a ledger
 *
 * Qualifiers only:
 * - describe presentation structure
 * - preserve constitutional context
 * - maintain neutral classification
 * - preserve sovereignty invariants
 */

import { NetFinancialSurface } from "./net-financial-surface";

/**
 * Structural NET financial surface qualifiers.
 */
export type NetFinancialQualifier =
  | "SURFACE_PRESENT"
  | "SURFACE_BOUND"
  | "STRUCTURE_VALID"
  | "NEUTRAL_ARTIFACT";

/**
 * NET Financial Surface Qualifiers artifact.
 */
export interface NetFinancialQualifiers {
  /**
   * Constitutional attachment.
   */
  readonly doctrine: "CCF_Constitution_Attachment";

  /**
   * Artifact discriminator.
   */
  readonly status: "NET_FINANCIAL_QUALIFIERS";

  /**
   * Preserved NET financial surface reference.
   */
  readonly surface: NetFinancialSurface;

  /**
   * Structural descriptors.
   */
  readonly qualifiers: ReadonlyArray<NetFinancialQualifier>;
}

/**
 * Build NET Financial Surface Qualifiers.
 *
 * Pure structural classification.
 */
export function buildNetFinancialQualifiers(
  surface: NetFinancialSurface,
  qualifiers: ReadonlyArray<NetFinancialQualifier>
): NetFinancialQualifiers {
  return Object.freeze({
    doctrine: "CCF_Constitution_Attachment",

    status: "NET_FINANCIAL_QUALIFIERS",

    surface,

    qualifiers: Object.freeze([...qualifiers]),
  });
}
