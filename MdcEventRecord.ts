/**
 * CyberCrowd-MDC — Event Record V1
 *
 * Purpose:
 * - Create bounded MDC event records from registered MDC artifacts.
 * - Preserve artifact registry lineage references.
 * - Provide immutable event reference layer for MDC ledger flow.
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

import type { MdcArtifactRegistry } from "./MdcArtifactRegistry";

export type MdcEventRecordStatus =
  | "MDC_EVENT_RECORD_CREATED"
  | "MDC_EVENT_RECORD_INVALID";

export interface MdcEventRecord {
  readonly status: MdcEventRecordStatus;

  /**
   * Immutable MDC event anchor.
   */
  readonly eventReference: string;

  /**
   * Source MDC artifact registry reference.
   */
  readonly registryReference: string;

  /**
   * Artifact references included in this event record.
   */
  readonly artifactReferences: readonly string[];

  /**
   * Event creation timestamp.
   */
  readonly createdAt: string;
}

export interface CreateMdcEventRecordInput {
  readonly registry: MdcArtifactRegistry;
}

/**
 * Creates bounded MDC event record.
 *
 * Structural event creation only.
 */
export const createMdcEventRecord = (
  input: CreateMdcEventRecordInput,
): MdcEventRecord => {

  const valid =
    Boolean(input.registry) &&
    Boolean(input.registry.registryReference) &&
    Array.isArray(input.registry.artifacts) &&
    input.registry.artifacts.length > 0 &&
    input.registry.artifacts.every(a =>
      Boolean(a.artifactReference),
    );

  if (!valid) {
    throw new Error("INVALID_MDC_EVENT_RECORD_INPUT");
  }

  const now =
    new Date().toISOString();

  return Object.freeze({
    status:
      "MDC_EVENT_RECORD_CREATED",

    eventReference:
      `mdc-event-record:${crypto.randomUUID()}`,

    registryReference:
      input.registry.registryReference,

    artifactReferences:
      Object.freeze(
        input.registry.artifacts.map(a =>
          a.artifactReference,
        ),
      ),

    createdAt:
      now,
  });
};

/**
 * Structural validation only.
 */
export const validateMdcEventRecord = (
  record: MdcEventRecord,
): boolean => {

  return (
    record.status === "MDC_EVENT_RECORD_CREATED" &&
    Boolean(record.eventReference) &&
    Boolean(record.registryReference) &&
    Array.isArray(record.artifactReferences) &&
    record.artifactReferences.length > 0 &&
    record.artifactReferences.every(Boolean) &&
    Boolean(record.createdAt)
  );
};
