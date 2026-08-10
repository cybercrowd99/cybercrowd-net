/**
 * NET — Execution Surface for CORE → NET Handoff
 *
 * ONE JOB:
 * Declare that NET is structurally ready to execute behavior
 * on a routed CORE → NET handoff. This declaration does not
 * perform execution, mutate artifacts, or contact external services.
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
 * - perform routing
 */

import type { NetCasesRouting } from "./net-cases-routing";

export interface NetCasesExecution {
  readonly executionReady: true;
  readonly executionReadyAt: string;

  /**
   * The routed handoff artifact.
   * NET does not execute or mutate it here.
   */
  readonly handoff: NetCasesRouting;
}

export const declareNetExecutionReady = (
  routed: NetCasesRouting,
): NetCasesExecution =>
  Object.freeze({
    executionReady: true as const,
    executionReadyAt: new Date().toISOString(),
    handoff: routed,
  });
