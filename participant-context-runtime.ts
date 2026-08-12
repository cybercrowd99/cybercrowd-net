/**
 * CyberCrowd
 * Participant Context Runtime
 *
 * ONE JOB:
 * Expose the runtime participant-context surface.
 *
 * Ownership:
 * PARTICIPANT
 *
 * Boundary:
 * Runtime-facing participant context only.
 *
 * Does not:
 * - create identity
 * - create relationships
 * - create continuity
 * - create evidence
 * - mutate adjacent organs
 * - authorize behavior
 */

export default {
  async fetch() {
    return Response.json({
      participant: {
        identity: "PARTICIPANT-IDENTITY",
        relationships: "PARTICIPANT-RELATIONSHIPS",
        continuity: "PARTICIPANT-CONTINUITY",
        evidence: "PARTICIPANT-EVIDENCE"
      }
    });
  }
};
