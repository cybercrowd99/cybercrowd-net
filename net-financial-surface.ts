/**
 * NET — Financial Surface
 *
 * The NET Financial Surface provides the bounded public-facing
 * structural presentation layer for the CCF financial organ.
 *
 * It does not:
 * - expose money
 * - expose balances
 * - expose transactions
 * - expose accounts
 * - expose identity
 * - perform payment execution
 * - perform financial interpretation
 * - create financial profiles
 *
 * Surface only:
 * - presents permitted financial structure
 * - preserves CORE boundary
 * - maintains constitutional attachment
 * - provides neutral NET exposure
 */

import { CoreFinancialOrganSurface } from "./core-financial-organ-surface";

/**
 * NET Financial Surface artifact.
 */
export interface NetFinancialSurface {
  /**
   * Constitutional attachment.
   */
  readonly doctrine: "CCF_Constitution_Attachment";

  /**
   * Artifact discriminator.
   */
  readonly status: "NET_FINANCIAL_SURFACE";

  /**
   * Preserved CORE financial organ surface.
   *
   * Never enriched.
   * Never modified.
   * Never interpreted.
   */
  readonly coreSurface: CoreFinancialOrganSurface;

  /**
   * Passive exposure state.
   */
  readonly surfaceState: "EXPOSED";
}

/**
 * Build NET Financial Surface.
 *
 * Pure structural presentation.
 *
 * This creates the boundary between CORE-preserved
 * financial structure and NET presentation.
 */
export function buildNetFinancialSurface(
  coreSurface: CoreFinancialOrganSurface
): NetFinancialSurface {
  const artifact: NetFinancialSurface = {
    doctrine: "CCF_Constitution_Attachment",

    status: "NET_FINANCIAL_SURFACE",

    coreSurface,

    surfaceState: "EXPOSED",
  };

  return Object.freeze(artifact);
}
