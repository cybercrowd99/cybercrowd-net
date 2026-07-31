/**
 * NET — Financial Surface Presentation
 *
 * The NET Financial Surface Presentation provides the bounded final
 * presentation layer for the CCF financial structure exposure.
 *
 * It does not:
 * - expose financial data
 * - expose identity
 * - expose accounts
 * - expose balances
 * - expose transactions
 * - execute payments
 * - perform routing
 * - create financial meaning
 * - modify CORE structure
 *
 * Presentation only:
 * - presents preserved NET financial surface state
 * - maintains constitutional attachment
 * - preserves sovereignty boundaries
 * - provides neutral public-facing structure
 */

import { NetFinancialSurface } from "./net-financial-surface";
import { NetFinancialLifecycle } from "./net-financial-lifecycle";
import { NetFinancialNeutralTransport } from "./net-financial-neutral-transport";
import { NetFinancialAdjudication } from "./net-financial-adjudication";
import { NetFinancialOutcome } from "./net-financial-outcome";
import { NetFinancialQualifiers } from "./net-financial-qualifiers";
import { NetFinancialDeweyMap } from "./net-financial-dewey-map";

/**
 * NET Financial Surface Presentation artifact.
 */
export interface NetFinancialPresentation {
  /**
   * Constitutional attachment.
   */
  readonly doctrine: "CCF_Constitution_Attachment";

  /**
   * Artifact discriminator.
   */
  readonly status: "NET_FINANCIAL_PRESENTATION";

  /**
   * Preserved NET financial surface.
   */
  readonly surface: NetFinancialSurface;

  /**
   * Structural lifecycle.
   */
  readonly lifecycle: NetFinancialLifecycle;

  /**
   * Neutral transport state.
   */
  readonly transport: NetFinancialNeutralTransport;

  /**
   * Structural adjudication.
   */
  readonly adjudication: NetFinancialAdjudication;

  /**
   * Structural outcome.
   */
  readonly outcome: NetFinancialOutcome;

  /**
   * Structural qualifiers.
   */
  readonly qualifiers: NetFinancialQualifiers;

  /**
   * Structural organization map.
   */
  readonly deweyMap: NetFinancialDeweyMap;
}

/**
 * Build NET Financial Surface Presentation.
 *
 * Pure structural presentation.
 */
export function buildNetFinancialPresentation(
  surface: NetFinancialSurface,
  lifecycle: NetFinancialLifecycle,
  transport: NetFinancialNeutralTransport,
  adjudication: NetFinancialAdjudication,
  outcome: NetFinancialOutcome,
  qualifiers: NetFinancialQualifiers,
  deweyMap: NetFinancialDeweyMap
): NetFinancialPresentation {
  const artifact: NetFinancialPresentation = {
    doctrine: "CCF_Constitution_Attachment",

    status: "NET_FINANCIAL_PRESENTATION",

    surface,

    lifecycle,

    transport,

    adjudication,

    outcome,

    qualifiers,

    deweyMap,
  };

  return Object.freeze(artifact);
}
