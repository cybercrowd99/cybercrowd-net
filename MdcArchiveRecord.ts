/**
 * CyberCrowd-MDC — Archive Record V1
 *
 * Purpose:
 * - Create bounded MDC archive records from ledger artifacts.
 * - Preserve MDC artifact references.
 * - Provide immutable archival intake boundary.
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

import type { MdcLedgerArtifact } from "./MdcLedgerArtifact";

export type MdcArchiveRecordStatus =
  | "MDC_ARCHIVE_RECORD_CREATED"
  | "MDC_ARCHIVE_RECORD_INVALID";

export interface MdcArchiveRecord {
  readonly status: MdcArchiveRecordStatus;

  /**
   * Immutable MDC archive record reference.
   */
  readonly archiveReference: string;

  /**
   * Source MDC ledger artifact reference.
   */
  readonly ledgerArtifactReference: string;

  /**
   * Ledger entry references preserved through archive boundary.
   */
  readonly ledgerEntryReferences: readonly string[];

  /**
   * Archive creation timestamp.
   */
  readonly createdAt: string;
}

export interface CreateMdcArchiveRecordInput {
  readonly artifact: MdcLedgerArtifact;
}

/**
 * Creates bounded MDC archive record.
 *
 * Structural archive creation only.
 */
export const createMdcArchiveRecord = (
  input: CreateMdcArchiveRecordInput,
): MdcArchiveRecord => {

  const valid =
    Boolean(input.artifact) &&
    input.artifact.status === "MDC_LEDGER_ARTIFACT_CREATED" &&
    Boolean(input.artifact.artifactReference) &&
    Array.isArray(input.artifact.ledgerEntryReferences) &&
    input.artifact.ledgerEntryReferences.length > 0 &&
    input.artifact.ledgerEntryReferences.every(Boolean);

  if (!valid) {
    throw new Error("INVALID_MDC_ARCHIVE_RECORD_INPUT");
  }

  const now =
    new Date().toISOString();

  return Object.freeze({
    status:
      "MDC_ARCHIVE_RECORD_CREATED",

    archiveReference:
      `mdc-archive-record:${crypto.randomUUID()}`,

    ledgerArtifactReference:
      input.artifact.artifactReference,

    ledgerEntryReferences:
      Object.freeze(
        [...input.artifact.ledgerEntryReferences],
      ),

    createdAt:
      now,
  });
};

/**
 * Structural validation only.
 */
export const validateMdcArchiveRecord = (
  record: MdcArchiveRecord,
): boolean => {

  return (
    record.status === "MDC_ARCHIVE_RECORD_CREATED" &&
    Boolean(record.archiveReference) &&
    Boolean(record.ledgerArtifactReference) &&
    Array.isArray(record.ledgerEntryReferences) &&
    record.ledgerEntryReferences.length > 0 &&
    record.ledgerEntryReferences.every(Boolean) &&
    Boolean(record.createdAt)
  );
};
