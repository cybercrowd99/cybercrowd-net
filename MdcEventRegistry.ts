/**
 * CyberCrowd-MDC — Event Registry V1
 *
 * Purpose:
 * - Register bounded MDC event records.
 * - Preserve event record lineage references.
 * - Provide immutable event registry boundary for MDC ledger flow.
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

import type { MdcEventRecord } from "./MdcEventRecord";

export type MdcEventRegistryStatus =
  | "MDC_EVENT_REGISTRY_CREATED"
  | "MDC_EVENT_REGISTRY_INVALID";

export interface MdcEventRegistry {
  readonly status: MdcEventRegistryStatus;

  /**
   * Immutable MDC event registry reference.
   */
  readonly registryReference: string;

  /**
   * Registered MDC event references.
   */
  readonly eventReferences: readonly string[];

  /**
   * Registry creation timestamp.
   */
  readonly createdAt: string;
}

export interface CreateMdcEventRegistryInput {
  readonly events: readonly MdcEventRecord[];
}

/**
 * Creates bounded MDC event registry.
 *
 * Structural registry creation only.
 */
export const createMdcEventRegistry = (
  input: CreateMdcEventRegistryInput,
): MdcEventRegistry => {

  const valid =
    Array.isArray(input.events) &&
    input.events.length > 0 &&
    input.events.every(event =>
      event.status === "MDC_EVENT_RECORD_CREATED" &&
      Boolean(event.eventReference),
    );

  if (!valid) {
    throw new Error("INVALID_MDC_EVENT_REGISTRY_INPUT");
  }

  const now =
    new Date().toISOString();

  return Object.freeze({
    status:
      "MDC_EVENT_REGISTRY_CREATED",

    registryReference:
      `mdc-event-registry:${crypto.randomUUID()}`,

    eventReferences:
      Object.freeze(
        input.events.map(event =>
          event.eventReference,
        ),
      ),

    createdAt:
      now,
  });
};

/**
 * Structural validation only.
 */
export const validateMdcEventRegistry = (
  registry: MdcEventRegistry,
): boolean => {

  return (
    registry.status === "MDC_EVENT_REGISTRY_CREATED" &&
    Boolean(registry.registryReference) &&
    Array.isArray(registry.eventReferences) &&
    registry.eventReferences.length > 0 &&
    registry.eventReferences.every(Boolean) &&
    Boolean(registry.createdAt)
  );
};
