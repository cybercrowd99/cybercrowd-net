/**
 * NET — Operational State Boundary Surface
 *
 * ONE JOB:
 * Establish a declared NET operational-state boundary that freezes the
 * displayed NET operational-state surface for organ-level progression
 * without interpreting, mutating, or expanding the operational state.
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

import type { NETOperationalStateDisplay } from "./net-operational-state-display-surface";

export interface NETOperationalStateBoundary {
  readonly bounded: true;
  readonly boundedAt: string;
  readonly display: NETOperationalStateDisplay;
}

export const declareNETOperationalStateBoundary = (
  display: NETOperationalStateDisplay,
): NETOperationalStateBoundary =>
  Object.freeze({
    bounded: true as const,
    boundedAt: new Date().toISOString(),
    display,
  });
