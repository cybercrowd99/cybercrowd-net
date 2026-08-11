/**
 * NET — Operational State Result Surface
 *
 * ONE JOB:
 * Record the bounded NET operational-state surface as a stable,
 * immutable result without interpreting, mutating, or expanding the
 * operational state.
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

import type { NETOperationalStateBoundary } from "./net-operational-state-boundary";

export interface NETOperationalStateResult {
  readonly recorded: true;
  readonly recordedAt: string;
  readonly boundary: NETOperationalStateBoundary;
}

export const recordNETOperationalStateResult = (
  boundary: NETOperationalStateBoundary,
): NETOperationalStateResult =>
  Object.freeze({
    recorded: true as const,
    recordedAt: new Date().toISOString(),
    boundary,
  });
