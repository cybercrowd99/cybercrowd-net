/**
 * NET — Routing Surface for CORE → NET Handoff
 *
 * ONE JOB:
 * Provide a non-executing routing surface for a processed
 * CORE → NET handoff. NET determines the allowed structural
 * direction without executing behavior, contacting external
 * services, mutating artifacts, making decisions, or forwarding.
 *
 * Does NOT:
 * - execute NET logic
 * - contact external services
 * - mutate CASES
 * - mutate CORE
 * - create identity
 * - create lineage
 * - generate authority
 * - make decisions or actions
 * - forward to another service
 */

import type { CoreCasesNetHandoff } from "./core-cases-net-handoff";

export interface NetCasesRouting {
  readonly routed: true;
  readonly routedAt: string;

  /**
   * The processed handoff artifact.
   * NET determines structural direction but does not modify it.
   */
  readonly handoff: CoreCasesNetHandoff;

  /**
   * Structural direction only.
   * No execution, forwarding, or external contact.
   */
  readonly direction: "LOCAL" | "NET_INTERNAL" | "BLOCKED";
}

export const routeCasesNetHandoff = (
  handoff: CoreCasesNetHandoff,
  direction: "LOCAL" | "NET_INTERNAL" | "BLOCKED",
): NetCasesRouting =>
  Object.freeze({
    routed: true as const,
    routedAt: new Date().toISOString(),
    handoff,
    direction,
  });
