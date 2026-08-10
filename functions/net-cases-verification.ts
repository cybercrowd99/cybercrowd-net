/**
 * NET — Verification Surface for CORE → NET Handoff
 *
 * ONE JOB:
 * Verify that a CORE → NET handoff is structurally valid
 * without executing NET behavior or contacting external services.
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

export interface NetCasesVerification {
  readonly verified: true;
  readonly verifiedAt: string;

  /**
   * The accepted handoff artifact.
   * NET does not modify or interpret it here.
   */
  readonly handoff: CoreCasesNetHandoff;
}

export const verifyCasesNetHandoff = (
  handoff: CoreCasesNetHandoff,
): NetCasesVerification =>
  Object.freeze({
    verified: true as const,
    verifiedAt: new Date().toISOString(),
    handoff,
  });
