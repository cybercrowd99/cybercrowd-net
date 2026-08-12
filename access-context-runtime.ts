/**
 * CyberCrowd
 * Access Context Runtime
 *
 * ONE JOB:
 * Expose the runtime access-context surface.
 *
 * Ownership:
 * ACCESS
 *
 * Boundary:
 * Runtime-facing access context only.
 *
 * Does not:
 * - create permissions
 * - create identity
 * - define boundaries
 * - create continuity
 * - mutate adjacent organs
 * - authorize behavior
 */

export default {
  async fetch() {
    return Response.json({
      access: {
        permissions: "ACCESS-PERMISSIONS",
        identity: "ACCESS-IDENTITY",
        boundaries: "ACCESS-BOUNDARIES",
        continuity: "ACCESS-CONTINUITY"
      }
    });
  }
};
