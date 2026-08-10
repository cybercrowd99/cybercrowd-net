/**
 * NET — Result Surface for CORE → NET Handoff
 *
 * ONE JOB:
 * Declare the structural NET result for a completed CORE → NET
 * handoff. This does not execute NET logic, mutate artifacts,
 * or contact external services.
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

import type { NetCasesCompletion } from "./net-cases-completion";

export interface NetCasesResult {
  readonly resultDeclared: true;
  readonly resultDeclaredAt: string;

  /**
   * The completed handoff artifact.
   * NET does not execute or mutate it here.
   */
  readonly handoff: NetCasesCompletion;
}

export const declareNetResult = (
  completion: NetCasesCompletion,
): NetCasesResult =>
  Object.freeze({
    resultDeclared: true as const,
    resultDeclaredAt: new Date().toISOString(),
    handoff: completion,
  });
