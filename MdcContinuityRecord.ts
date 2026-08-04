/**
 * CyberCrowd-MDC — Continuity Record V1
 *
 * Purpose:
 * - Create bounded MDC continuity records from archive registries.
 * - Preserve MDC archival lineage references.
 * - Provide immutable continuity reference layer.
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

import type { MdcArchiveRegistry } from "./MdcArchiveRegistry";

export type MdcContinuityRecordStatus =
  | "MDC_CONTINUITY_RECORD_CREATED"
  | "MDC_CONTINUITY_RECORD_INVALID";

export interface MdcContinuityRecord {
  readonly status: MdcContinuityRecordStatus;

  /**
   * Immutable MDC continuity reference.
   */
  readonly continuityReference: string;

  /**
   * Source MDC archive registry reference.
   */
  readonly archiveRegistryReference: string;

  /**
   * Archive record references preserved through continuity boundary.
   */
  readonly archiveRecordReferences: readonly string[];

  /**
   * Continuity record creation timestamp.
   */
  readonly createdAt: string;
}

export interface CreateMdcContinuityRecordInput {
  readonly registry: MdcArchiveRegistry;
}

/**
 * Creates bounded MDC continuity record.
 *
 * Structural continuity creation only.
 */
export const createMdcContinuityRecord = (
  input: CreateMdcContinuityRecordInput,
): MdcContinuityRecord => {

  const valid =
    Boolean(input.registry) &&
    input.registry.status === "MDC_ARCHIVE_REGISTRY_CREATED" &&
    Boolean(input.registry.registryReference) &&
    Array.isArray(input.registry.archiveRecordReferences) &&
    input.registry.archiveRecordReferences.length > 0 &&
    input.registry.archiveRecordReferences.every(Boolean);

  if (!valid) {
    throw new Error("INVALID_MDC_CONTINUITY_RECORD_INPUT");
  }

  const now =
    new Date().toISOString();

  return Object.freeze({
    status:
      "MDC_CONTINUITY_RECORD_CREATED",

    continuityReference:
      `mdc-continuity-record:${crypto.randomUUID()}`,

    archiveRegistryReference:
      input.registry.registryReference,

    archiveRecordReferences:
      Object.freeze(
        [...input.registry.archiveRecordReferences],
      ),

    createdAt:
      now,
  });
};

/**
 * Structural validation only.
 */
export const validateMdcContinuityRecord = (
  record: MdcContinuityRecord,
): boolean => {

  return (
    record.status === "MDC_CONTINUITY_RECORD_CREATED" &&
    Boolean(record.continuityReference) &&
    Boolean(record.archiveRegistryReference) &&
    Array.isArray(record.archiveRecordReferences) &&
    record.archiveRecordReferences.length > 0 &&
    record.archiveRecordReferences.every(Boolean) &&
    Boolean(record.createdAt)
  );
};
