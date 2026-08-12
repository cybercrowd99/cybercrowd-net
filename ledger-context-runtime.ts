/**
 * CyberCrowd
 * Ledger Context Runtime
 *
 * ONE JOB:
 * Expose the runtime ledger-context surface.
 *
 * Ownership:
 * LEDGER
 *
 * Boundary:
 * Runtime-facing ledger context only.
 *
 * Does not:
 * - create records
 * - create evidence
 * - create continuity
 * - create identity
 * - mutate adjacent organs
 * - authorize behavior
 */

export default {
  async fetch() {
    return Response.json({
      ledger: {
        record: "LEDGER-RECORD",
        evidence: "LEDGER-EVIDENCE",
        continuity: "LEDGER-CONTINUITY",
        identity: "LEDGER-IDENTITY"
      }
    });
  }
};
