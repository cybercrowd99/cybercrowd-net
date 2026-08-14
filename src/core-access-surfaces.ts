/**
 * CORE — CyberCrowd
 *
 * Access Surface Registry
 * ------------------------------------------------------------
 * ONE JOB:
 * Declare the structural access surfaces exposed by CORE.
 *
 * CORE is a choice-surface organ. It does not act, infer,
 * authorize, transform, or enrich. It only exposes the four
 * CORE surfaces so upstream and downstream organs know which
 * structural context they are interacting with.
 *
 * Ownership Boundary:
 *
 *        CORE
 *         │
 *         ├── CORE-IDENTITY
 *         ├── CORE-STRUCTURAL
 *         ├── CORE-CONTINUITY
 *         └── CORE-CAPABILITY
 *
 * Non‑Responsibilities:
 * - execute independent service behavior
 * - infer capability or intent
 * - authorize access or actions
 * - transform requests or declarations
 * - enrich metadata or context
 * - create service relationships
 * - transfer ownership across organs
 *
 * CORE is a pure declaration organ.
 * It defines surfaces; it does not perform behavior.
 *
 * Chain Context:
 * CASES → CORE → NET
 */

export default {
  core: {
    identity: "CORE-IDENTITY",
    structural: "CORE-STRUCTURAL",
    continuity: "CORE-CONTINUITY",
    capability: "CORE-CAPABILITY",
  },
};
