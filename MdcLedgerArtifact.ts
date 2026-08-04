/**
 * CyberCrowd-MDC — Ledger Artifact V1
 *
 * Purpose:
 * - Create bounded MDC ledger artifacts from registered ledger entries.
 * - Preserve ledger registry references.
 * - Provide immutable MDC archival artifact layer.
 *
 * Does NOT:
 * - own identity
 * - create behavioral profiles
 * - mutate NET lineage
 * - mutate CORE state
 * - mutate OSAR state
 * - authorize behavior
 * - execute transactions
 */

import type { MdcLedgerRegistry } from "./MdcLedgerRegistry";

export type MdcLedgerArtifactStatus =
  | "MDC_LEDGER_ARTIFACT_CREATED"
  | "MDC_LEDGER_ARTIFACT_INVALID";

export interface MdcLedgerArtifact {
  readonly status: MdcLedgerArtifactStatus;

  /**
   * Immutable MDC ledger artifact reference.
   */
  readonly artifactReference: string;

  /**
   * Source MDC ledger registry reference.
   */
  readonly ledgerRegistryReference: string;

  /**
   * Ledger entry references preserved in artifact.
   */
  readonly ledgerEntryReferences: readonly string[];

  /**
   * Artifact creation timestamp.
   */
  readonly createdAt: string;
}

export interface CreateMdcLedgerArtifactInput {
  readonly registry: MdcLedgerRegistry;
}

/**
 * Creates bounded MDC ledger artifact.
 *
 * Structural artifact creation only.
 */
export const createMdcLedgerArtifact = (
  input: CreateMdcLedgerArtifactInput,
): MdcLedgerArtifact => {

  const valid =
    Boolean(input.registry) &&
    input.registry.status === "MDC_LEDGER_REGISTRY_CREATED" &&
    Boolean(input.registry.registryReference) &&
    Array.isArray(input.registry.ledgerEntryReferences) &&
    input.registry.ledgerEntryReferences.length > 0 &&
    input.registry.ledgerEntryReferences.every(Boolean);

  if (!valid) {
    throw new Error("INVALID_MDC_LEDGER_ARTIFACT_INPUT");
  }

  const now =
    new Date().toISOString();

  return Object.freeze({
    status:
      "MDC_LEDGER_ARTIFACT_CREATED",

    artifactReference:
      `mdc-ledger-artifact:${crypto.randomUUID()}`,

    ledgerRegistryReference:
      input.registry.registryReference,

    ledgerEntryReferences:
      Object.freeze(
        [...input.registry.ledgerEntryReferences],
      ),

    createdAt:
      now,
  });
};

/**
 * Structural validation only.
 */
export const validateMdcLedgerArtifact = (
  artifact: MdcLedgerArtifact,
): boolean => {

  return (
    artifact.status === "MDC_LEDGER_ARTIFACT_CREATED" &&
    Boolean(artifact.artifactReference) &&
    Boolean(artifact.ledgerRegistryReference) &&
    Array.isArray(artifact.ledgerEntryReferences) &&
    artifact.ledgerEntryReferences.length > 0 &&
    artifact.ledgerEntryReferences.every(Boolean) &&
    Boolean(artifact.createdAt)
  );
};
