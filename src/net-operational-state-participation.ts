/**
 * NET — Operational State Participation Surface
 *
 * ONE JOB:
 * Declare organ-level participation of the routed NET operational-state
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

import type { NETOperationalStateRoute } from "./net-operational-state-router";

export interface NETOperationalStateParticipation {
  readonly participating: true;
  readonly participatingAt: string;
  readonly route: NETOperationalStateRoute;
}

export const declareNETOperationalStateParticipation = (
  route: NETOperationalStateRoute,
): NETOperationalStateParticipation =>
  Object.freeze({
    participating: true as const,
    participatingAt: new Date().toISOString(),
    route,
  });
