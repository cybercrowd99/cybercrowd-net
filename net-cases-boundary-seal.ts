/**
 * NET — Boundary Seal for CORE → NET Handoff
 *
 * ONE JOB:
 * Seal the NET boundary after the result has been declared.
 * This prevents further mutation, routing, execution, or delivery.
 *
 * Does NOT:
 * - execute NET logic
 * - deliver NET behavior
 * - contact external services
 * - mutate CASES
 * - mutate CORE
 * - create identity
 * - create lineage
 * - generate authority
 * - make decisions
 * - perform routing
 */

import type { NetCasesResult } from "./net-cases-result";

export interface NetCasesBoundarySeal {
  readonly sealed: true;
  readonly sealedAt: string;
  readonly handoff: NetCasesResult;
}

export const sealNetBoundary = (
  result: NetCasesResult,
): NetCasesBoundarySeal =>
  Object.freeze({
    sealed: true as const,
    sealedAt: new Date().toISOString(),
    handoff: result,
  });
