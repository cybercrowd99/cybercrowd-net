/**
 * CyberCrowd
 * Role Context Runtime
 *
 * ONE JOB:
 * Expose the runtime role-context surface.
 *
 * Ownership:
 * ROLE
 *
 * Boundary:
 * Runtime-facing role context only.
 *
 * Does not:
 * - define role
 * - define boundaries
 * - create continuity
 * - create evidence
 * - mutate adjacent organs
 * - authorize behavior
 */

export default {
  async fetch() {
    return Response.json({
      role: {
        definition: "ROLE-DEFINITION",
        boundaries: "ROLE-BOUNDARIES",
        continuity: "ROLE-CONTINUITY",
        evidence: "ROLE-EVIDENCE"
      }
    });
  }
};
