/**
 * NET — Delivery Surface for CORE → NET Handoff
 *
 * ONE JOB:
 * Declare that NET is structurally ready to deliver behavior
 * on an execution-ready CORE → NET handoff. This declaration
 * does not perform delivery, mutate artifacts, or contact
 * external services.
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

import type { NetCasesExecution } from "./net-cases-execution";

export interface NetCasesDelivery {
  readonly deliveryReady: true;
  readonly deliveryReadyAt: string;

  /**
   * The execution-ready handoff artifact.
   * NET does not deliver or mutate it here.
   */
  readonly handoff: NetCasesExecution;
}

export const declareNetDeliveryReady = (
  executionReady: NetCasesExecution,
): NetCasesDelivery =>
  Object.freeze({
    deliveryReady: true as const,
    deliveryReadyAt: new Date().toISOString(),
    handoff: executionReady,
  });
