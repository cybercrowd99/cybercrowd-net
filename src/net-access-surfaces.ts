/**
 * NET — CyberCrowd
 *
 * Access Surface Registry
 *
 * ONE JOB:
 * Declare the structural access surfaces exposed by NET.
 *
 * Ownership boundary:
 *
 *   NET
 *    │
 *    ├── NET-LINEAGE
 *    ├── NET-CAPABILITY
 *    ├── NET-RECEIVERS
 *    └── NET-STRUCTURAL
 *
 * This module does not:
 * - execute service behavior
 * - infer capability
 * - authorize access
 * - transform requests
 * - enrich metadata
 * - create service relationships
 * - transfer ownership
 *
 * It only declares the access-surface structure.
 *
 * CORE → NET
 */

export default {
  net: {
    lineage: "NET-LINEAGE",
    capability: "NET-CAPABILITY",
    receivers: "NET-RECEIVERS",
    structural: "NET-STRUCTURAL",
  },
};
