/**
 * CyberCrowd
 * Value Context Runtime
 *
 * ONE JOB:
 * Expose the runtime value-context surface.
 *
 * Ownership:
 * VALUE
 *
 * Boundary:
 * Runtime-facing value context only.
 *
 * Does not:
 * - define value
 * - create identity
 * - create continuity
 * - create evidence
 * - mutate adjacent organs
 * - authorize behavior
 */

export default {
  async fetch() {
    return Response.json({
      value: {
        definition: "VALUE-DEFINITION",
        identity: "VALUE-IDENTITY",
        continuity: "VALUE-CONTINUITY",
        evidence: "VALUE-EVIDENCE"
      }
    });
  }
};
