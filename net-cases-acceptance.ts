/**
 * NET — Acceptance Surface for CORE → NET Handoff
 *
 * ONE JOB:
 * Accept a structural CORE → NET handoff without executing
 * NET behavior, contacting external services, or mutating artifacts.
 *
 * Does NOT:
 * - execute NET logic
 * - contact external services
 * - mutate CASES
 * - mutate CORE
 * - create identity
 * - create lineage
 * - generate authority
 * - make decisions
 * - route or forward
 */

import type { CoreCasesNetHandoff } from "./core-cases-net-handoff";

export interface NetCasesAcceptance {
  readonly accepted: true;
  readonly acceptedAt: string;

  /**
   * The handoff artifact created by CORE.
   * NET does not modify or interpret it here.
   */
  readonly handoff: CoreCasesNetHandoff;
}

export const acceptCasesNetHandoff = (
  handoff: CoreCasesNetHandoff,
): NetCasesAcceptance =>
  Object.freeze({
    accepted: true as const,
    acceptedAt: new Date().toISOString(),
    handoff,
  });
