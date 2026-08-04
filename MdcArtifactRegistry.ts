/**
 * CyberCrowd-MDC — Artifact Registry V1
 *
 * Purpose:
 * - Register bounded MDC signal artifacts into an immutable registry boundary.
 * - Preserve artifact lineage references for MDC audit and replay.
 * - Provide deterministic MDC artifact indexing.
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

import type { MdcSignalArtifact } from "./MdcSignalArtifact";

export type MdcArtifactRegistryStatus =
  | "MDC_ARTIFACT_REGISTRY_CREATED"
  | "MDC_ARTIFACT_REGISTRY_INVALID";

export interface MdcArtifactRegistryEntry {
  readonly artifactReference: string;
  readonly registeredAt: string;
}

export interface MdcArtifactRegistry {
  readonly status: MdcArtifactRegistryStatus;

  /**
   * Immutable MDC registry anchor.
   */
  readonly registryReference: string;

  /**
   * Registered MDC artifacts.
   */
  readonly artifacts: readonly MdcArtifactRegistryEntry[];

  /**
   * Registry creation timestamp.
   */
  readonly createdAt: string;
}

export interface CreateMdcArtifactRegistryInput {
  readonly artifacts: readonly MdcSignalArtifact[];
}

/**
 * Creates bounded MDC artifact registry.
 *
 * Structural registration only.
 */
export const createMdcArtifactRegistry = (
  input: CreateMdcArtifactRegistryInput,
): MdcArtifactRegistry => {

  const valid =
    Array.isArray(input.artifacts) &&
    input.artifacts.length > 0 &&
    input.artifacts.every(a =>
      Boolean(a.artifactReference),
    );

  if (!valid) {
    throw new Error("INVALID_MDC_ARTIFACT_REGISTRY_INPUT");
  }

  const now =
    new Date().toISOString();

  const artifacts =
    Object.freeze(
      input.artifacts.map(a =>
        Object.freeze({
          artifactReference:
            a.artifactReference,

          registeredAt:
            now,
        }),
      ),
    );

  return Object.freeze({
    status:
      "MDC_ARTIFACT_REGISTRY_CREATED",

    registryReference:
      `mdc-artifact-registry:${crypto.randomUUID()}`,

    artifacts,

    createdAt:
      now,
  });
};

/**
 * Structural validation only.
 */
export const validateMdcArtifactRegistry = (
  registry: MdcArtifactRegistry,
): boolean => {

  return (
    registry.status === "MDC_ARTIFACT_REGISTRY_CREATED" &&
    Boolean(registry.registryReference) &&
    Array.isArray(registry.artifacts) &&
    registry.artifacts.length > 0 &&
    registry.artifacts.every(a =>
      Boolean(a.artifactReference) &&
      Boolean(a.registeredAt),
    ) &&
    Boolean(registry.createdAt)
  );
};
