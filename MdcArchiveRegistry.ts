/**
 * CyberCrowd-MDC — Archive Registry V1
 *
 * Purpose:
 * - Register bounded MDC archive records.
 * - Preserve archive lineage references.
 * - Provide immutable MDC archive registry layer.
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

import type { MdcArchiveRecord } from "./MdcArchiveRecord";

export type MdcArchiveRegistryStatus =
  | "MDC_ARCHIVE_REGISTRY_CREATED"
  | "MDC_ARCHIVE_REGISTRY_INVALID";

export interface MdcArchiveRegistry {
  readonly status: MdcArchiveRegistryStatus;

  /**
   * Immutable MDC archive registry reference.
   */
  readonly registryReference: string;

  /**
   * Registered archive record references.
   */
  readonly archiveRecordReferences: readonly string[];

  /**
   * Registry creation timestamp.
   */
  readonly createdAt: string;
}

export interface CreateMdcArchiveRegistryInput {
  readonly records: readonly MdcArchiveRecord[];
}

/**
 * Creates bounded MDC archive registry.
 *
 * Structural registry creation only.
 */
export const createMdcArchiveRegistry = (
  input: CreateMdcArchiveRegistryInput,
): MdcArchiveRegistry => {

  const valid =
    Array.isArray(input.records) &&
    input.records.length > 0 &&
    input.records.every(record =>
      record.status === "MDC_ARCHIVE_RECORD_CREATED" &&
      Boolean(record.archiveReference),
    );

  if (!valid) {
    throw new Error("INVALID_MDC_ARCHIVE_REGISTRY_INPUT");
  }

  const now =
    new Date().toISOString();

  return Object.freeze({
    status:
      "MDC_ARCHIVE_REGISTRY_CREATED",

    registryReference:
      `mdc-archive-registry:${crypto.randomUUID()}`,

    archiveRecordReferences:
      Object.freeze(
        input.records.map(record =>
          record.archiveReference,
        ),
      ),

    createdAt:
      now,
  });
};

/**
 * Structural validation only.
 */
export const validateMdcArchiveRegistry = (
  registry: MdcArchiveRegistry,
): boolean => {

  return (
    registry.status === "MDC_ARCHIVE_REGISTRY_CREATED" &&
    Boolean(registry.registryReference) &&
    Array.isArray(registry.archiveRecordReferences) &&
    registry.archiveRecordReferences.length > 0 &&
    registry.archiveRecordReferences.every(Boolean) &&
    Boolean(registry.createdAt)
  );
};
