/**
 * CyberCrowd-MDC — Continuity Registry V1
 *
 * Purpose:
 * - Register bounded MDC continuity records.
 * - Preserve continuity lineage references.
 * - Provide immutable MDC continuity registry layer.
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

import type { MdcContinuityRecord } from "./MdcContinuityRecord";

export type MdcContinuityRegistryStatus =
  | "MDC_CONTINUITY_REGISTRY_CREATED"
  | "MDC_CONTINUITY_REGISTRY_INVALID";

export interface MdcContinuityRegistry {
  readonly status: MdcContinuityRegistryStatus;

  /**
   * Immutable MDC continuity registry reference.
   */
  readonly registryReference: string;

  /**
   * Registered continuity record references.
   */
  readonly continuityRecordReferences: readonly string[];

  /**
   * Registry creation timestamp.
   */
  readonly createdAt: string;
}

export interface CreateMdcContinuityRegistryInput {
  readonly records: readonly MdcContinuityRecord[];
}

/**
 * Creates bounded MDC continuity registry.
 *
 * Structural registry creation only.
 */
export const createMdcContinuityRegistry = (
  input: CreateMdcContinuityRegistryInput,
): MdcContinuityRegistry => {

  const valid =
    Array.isArray(input.records) &&
    input.records.length > 0 &&
    input.records.every(record =>
      record.status === "MDC_CONTINUITY_RECORD_CREATED" &&
      Boolean(record.continuityReference),
    );

  if (!valid) {
    throw new Error("INVALID_MDC_CONTINUITY_REGISTRY_INPUT");
  }

  const now =
    new Date().toISOString();

  return Object.freeze({
    status:
      "MDC_CONTINUITY_REGISTRY_CREATED",

    registryReference:
      `mdc-continuity-registry:${crypto.randomUUID()}`,

    continuityRecordReferences:
      Object.freeze(
        input.records.map(record =>
          record.continuityReference,
        ),
      ),

    createdAt:
      now,
  });
};

/**
 * Structural validation only.
 */
export const validateMdcContinuityRegistry = (
  registry: MdcContinuityRegistry,
): boolean => {

  return (
    registry.status === "MDC_CONTINUITY_REGISTRY_CREATED" &&
    Boolean(registry.registryReference) &&
    Array.isArray(registry.continuityRecordReferences) &&
    registry.continuityRecordReferences.length > 0 &&
    registry.continuityRecordReferences.every(Boolean) &&
    Boolean(registry.createdAt)
  );
};
