/**
 * CYBERCROWD — NET
 *
 * SESSION Access Surface
 *
 * ONE JOB:
 * Expose the declared SESSION access surface.
 */

export default {
  async fetch() {
    return Response.json({
      session: {
        context: "SESSION-CONTEXT",
        identity: "SESSION-IDENTITY",
        continuity: "SESSION-CONTINUITY",
        evidence: "SESSION-EVIDENCE"
      }
    });
  }
};
