/**
 * NET — Interpretation Surface for CORE → NET Handoff
 *
 * ONE JOB:
 * Provide a non-executing interpretation surface for a verified
 * CORE → NET handoff. NET may read the verified artifact but does
 * not execute behavior, mutate artifacts, contact external services,
 * make decisions, or forward the handoff.
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
 * - route or forward
 */

import type { CoreCasesNetHandoff } from "./core-cases-net-handoff";

export interface NetCasesInterpretation {
  readonly interpreted: true;
  readonly interpretedAt: string;

  /**
   * The verified handoff artifact.
   * NET may read but does not modify or act on it here.
   */
  readonly handoff: CoreCasesNetHandoff;
}

export const interpretCasesNetHandoff = (
  handoff: CoreCasesNetHandoff,
): NetCasesInterpretation =>
  Object.freeze({
    interpreted: true as const,
    interpretedAt: new Date().toISOString(),
    handoff,
  });
