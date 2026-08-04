/**
 * CyberCrowd-NET — Net Surface Registry V1
 *
 * Purpose:
 * - Maintain bounded NET surface registry entries.
 * - Preserve deterministic NET surface enumeration.
 * - Provide immutable registry anchors for NET sovereign chain.
 *
 * Does NOT:
 * - access CORE state
 * - access OSAR artifacts
 * - authorize behavior
 * - mutate surface lineage
 * - expose CORE internals
 */

export type NetSurfaceRegistryStatus =
  | "NET_SURFACE_REGISTRY_CREATED"
  | "NET_SURFACE_REGISTRY_INVALID";

export interface NetSurfaceRegistryEntry {
  readonly surfaceId: string;
  readonly envelopeReference: string;
}

export interface NetSurfaceRegistry {
  readonly status: NetSurfaceRegistryStatus;

  /**
   * Immutable NET surface registry anchor.
   */
  readonly registryReference: string;

  /**
   * Frozen list of registered NET surfaces.
   */
  readonly surfaces: readonly NetSurfaceRegistryEntry[];

  /**
   * Registry creation timestamp.
   */
  readonly createdAt: string;
}

export interface CreateNetSurfaceRegistryInput {
  readonly surfaces: readonly {
    readonly surfaceId: string;
    readonly envelopeReference: string;
  }[];
}

/**
 * Creates bounded NET surface registry.
 *
 * Structural enumeration only.
 */
export const createNetSurfaceRegistry = (
  input: CreateNetSurfaceRegistryInput,
): NetSurfaceRegistry => {

  const valid =
    Array.isArray(input.surfaces) &&
    input.surfaces.length > 0 &&
    input.surfaces.every(s =>
      Boolean(s.surfaceId) &&
      Boolean(s.envelopeReference),
    );

  if (!valid) {
    throw new Error("INVALID_NET_SURFACE_REGISTRY_INPUT");
  }

  return Object.freeze({
    status: "NET_SURFACE_REGISTRY_CREATED",

    registryReference:
      `net-surface-registry:${crypto.randomUUID()}`,

    surfaces:
      Object.freeze([...input.surfaces]),

    createdAt:
      new Date().toISOString(),
  });
};

/**
 * Structural validation only.
 */
export const validateNetSurfaceRegistry = (
  registry: NetSurfaceRegistry,
): boolean => {

  return (
    registry.status === "NET_SURFACE_REGISTRY_CREATED" &&
    Boolean(registry.registryReference) &&
    Array.isArray(registry.surfaces) &&
    registry.surfaces.length > 0 &&
    registry.surfaces.every(s =>
      Boolean(s.surfaceId) &&
      Boolean(s.envelopeReference),
    ) &&
    Boolean(registry.createdAt)
  );
};
