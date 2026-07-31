/**
 * NET — Financial Surface Envelope
 *
 * The NET Financial Surface Envelope provides a bounded structural
 * wrapper for the CORE-preserved financial surface.
 *
 * It does not:
 * - store money
 * - represent ownership
 * - identify people
 * - contain accounts
 * - contain balances
 * - record transactions
 * - execute payments
 * - modify CORE structure
 *
 * Envelope only:
 * - preserves NET surface integrity
 * - provides neutral presentation wrapping
 * - maintains constitutional separation
 * - supports controlled NET exposure
 */

import { NetFinancialSurface } from "./net-financial-surface";

/**
 * NET Financial Surface Envelope artifact.
 */
export interface NetFinancialEnvelope {
  /**
   * Constitutional attachment.
   */
  readonly doctrine: "CCF_Constitution_Attachment";

  /**
   * Artifact discriminator.
   */
  readonly status: "NET_FINANCIAL_ENVELOPE";

  /**
   * Opaque structural envelope identifier.
   */
  readonly envelopeId: string;

  /**
   * Preserved NET financial surface reference.
   *
   * Never enriched.
   * Never modified.
   * Never interpreted.
   */
  readonly surface: NetFinancialSurface;
}

/**
 * Build NET Financial Surface Envelope.
 *
 * Pure structural wrapping.
 */
export function buildNetFinancialEnvelope(
  envelopeId: string,
  surface: NetFinancialSurface
): NetFinancialEnvelope {
  const artifact: NetFinancialEnvelope = {
    doctrine: "CCF_Constitution_Attachment",

    status: "NET_FINANCIAL_ENVELOPE",

    envelopeId,

    surface,
  };

  return Object.freeze(artifact);
}
