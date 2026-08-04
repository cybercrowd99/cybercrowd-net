/**
 * CyberCrowd-NET — Net Completion Proof V1
 *
 * Purpose:
 * - Attest that the NET sovereign projection shell has reached deterministic closure.
 * - Bind sealed NET lineage anchors into a single immutable completion proof.
 * - Provide a sovereign, non-authoritative proof artifact for CORE / OSAR / external audit.
 *
 * Does NOT:
 * - access or mutate CORE state
 * - access or mutate OSAR artifacts
 * - authorize behavior
 * - mutate NET lineage
 * - expose internal implementation details
 */

export type NetCompletionProofStatus =
  | "NET_COMPLETION_PROOF_CREATED"
  | "NET_COMPLETION_PROOF_INVALID";

export interface NetCompletionProofSealedOrganEntry {
  readonly organName: string;
  readonly organReference: string;
}

export interface NetCompletionProof {
  readonly status: NetCompletionProofStatus;
  readonly completionProofReference: string;
  readonly netDomainReference: string;
  readonly bindingClosureReference: string;
  readonly epochSeriesHistoryReference: string;
  readonly sealedOrgans: readonly NetCompletionProofSealedOrganEntry[];
  readonly createdAt: string;
}
