/**
 * CyberCrowd
 * CASES Context Runtime
 *
 * ONE JOB:
 * Expose the runtime CASES context surface.
 *
 * Ownership:
 * CASES
 *
 * Boundary:
 * Runtime-facing CASES service context only.
 *
 * Does not:
 * - execute adjacent organ behavior
 * - create identity
 * - create continuity
 * - redefine structure
 * - mutate adjacent organs
 * - authorize behavior
 */

export default {
  async fetch() {
    return Response.json({
      cases: {
        service: "CASES-SERVICE",
        continuity: "CASES-CONTINUITY",
        identity: "CASES-IDENTITY",
        structural: "CASES-STRUCTURAL"
      }
    });
  }
};
