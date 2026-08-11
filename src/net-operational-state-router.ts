/**
 * NET — Operational State Router Surface
 *
 * ONE JOB:
 * Route the immutable NET operational-state result into the correct
 * organ-level participation pathway without interpreting, mutating,
 * or expanding the operational state.
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

import type { NETOperationalStateResult } from "./net-operational-state-result";

export interface NETOperationalStateRoute {
  readonly routed: true;
  readonly routedAt: string;
  readonly result: NETOperationalStateResult;
}

export const routeNETOperationalState = (
  result: NETOperationalStateResult,
): NETOperationalStateRoute =>
  Object.freeze({
    routed: true as const,
    routedAt: new Date().toISOString(),
    result,
  });
