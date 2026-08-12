/**
 * CYBERCROWD — NET
 *
 * DATA Access Surface
 *
 * ONE JOB:
 * Expose the declared DATA access surface.
 */

export default {
  async fetch() {
    return Response.json({
      data: {
        definition: "DATA-DEFINITION",
        identity: "DATA-IDENTITY",
        continuity: "DATA-CONTINUITY",
        evidence: "DATA-EVIDENCE"
      }
    });
  }
};
