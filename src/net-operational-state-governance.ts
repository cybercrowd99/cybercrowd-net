/**
 * NET — Operational State Governance Surface
 *
 * ONE JOB:
 * Declare governance readiness of the participating NET operational-state
 * result without interpreting, mutating, or expanding the operational state.
 *
 * This surface does not:
 * - interpret doctrine
 * - mutate NET state
 * - mutate OSAR state
 * - expand lifecycle behavior
 * - create authority
 * - create identity
 * - execute governance
 * - execute organ behavior
 * - contact external services
 */

import type { NETOperationalStateParticipation } from "./net-operational-state-participation";

export interface NETOperationalStateGovernance {
  readonly governanceReady: true;
  readonly governanceReadyAt: string;
  readonly participation: NETOperationalStateParticipation;
}

export const declareNETOperationalStateGovernance = (
  participation: NETOperationalStateParticipation,
): NETOperationalStateGovernance =>
  Object.freeze({
    governanceReady: true as const,
    governanceReadyAt: new Date().toISOString(),
    participation,
  });
