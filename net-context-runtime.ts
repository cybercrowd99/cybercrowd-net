/**
 * CyberCrowd
 * NET Context Runtime
 *
 * ONE JOB:
 * Expose the runtime NET context surface.
 *
 * Ownership:
 * NET
 *
 * Boundary:
 * Runtime-facing NET context only.
 *
 * Does not:
 * - create lineage
 * - create capability
 * - create receivers
 * - redefine structure
 * - mutate adjacent organs
 * - authorize behavior
 */

export default {
  async fetch() {
    return Response.json({
      net: {
        lineage: "NET-LINEAGE",
        capability: "NET-CAPABILITY",
        receivers: "NET-RECEIVERS",
        structural: "NET-STRUCTURAL"
      }
    });
  }
};
