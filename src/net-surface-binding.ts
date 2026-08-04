/**
 * CyberCrowd-NET — Net Surface Binding V1
 *
 * Purpose:
 * - Bind approved NET surface registry entries into bounded NET projection context.
 * - Preserve deterministic NET surface binding continuity.
 * - Provide immutable binding anchors for NET sovereign-chain routing.
 *
 * Does NOT:
 * - access CORE state
 * - access OSAR artifacts
 * - authorize behavior
 * - mutate NET registry state
 * - expose CORE internals
 * - create identity
 * - create ownership
 */

export type NetSurfaceBindingStatus =
  | "NET_SURFACE_BINDING_CREATED"
  | "NET_SURFACE_BINDING_INVALID";

export interface NetSurfaceBindingEntry {
  readonly surfaceId: string;
  readonly envelopeReference: string;
  readonly bindingReference: string;
}

export interface NetSurfaceBinding {
  readonly status: NetSurfaceBindingStatus;

  /**
   * Immutable NET surface binding anchor.
   */
  readonly bindingReference: string;

  /**
   * Source NET surface registry anchor.
   */
  readonly registryReference: string;

  /**
   * Frozen NET surface binding lineage.
   */
  readonly bindings: readonly NetSurfaceBindingEntry[];

  /**
   * Binding creation timestamp.
   */
  readonly createdAt: string;
}

export interface CreateNetSurfaceBindingInput {
  readonly registryReference: string;

  readonly surfaces: readonly {
    readonly surfaceId: string;
    readonly envelopeReference: string;
  }[];
}

/**
 * Creates bounded NET surface binding.
 *
 * Structural binding only.
 */
export const createNetSurfaceBinding = (
  input: CreateNetSurfaceBindingInput,
): NetSurfaceBinding => {

  const valid =
    Boolean(input.registryReference) &&
    Array.isArray(input.surfaces) &&
    input.surfaces.length > 0 &&
    input.surfaces.every(surface =>
      Boolean(surface.surfaceId) &&
      Boolean(surface.envelopeReference),
    );

  if (!valid) {
    throw new Error("INVALID_NET_SURFACE_BINDING_INPUT");
  }

  const bindingReference =
    `net-surface-binding:${crypto.randomUUID()}`;

  const bindings: readonly NetSurfaceBindingEntry[] =
    Object.freeze(
      input.surfaces.map(surface =>
        Object.freeze({
          surfaceId: surface.surfaceId,
          envelopeReference: surface.envelopeReference,
          bindingReference,
        }),
      ),
    );

  return Object.freeze({
    status: "NET_SURFACE_BINDING_CREATED",

    bindingReference,

    registryReference:
      input.registryReference,

    bindings,

    createdAt:
      new Date().toISOString(),
  });
};

/**
 * Structural validation only.
 */
export const validateNetSurfaceBinding = (
  binding: NetSurfaceBinding,
): boolean => {

  return (
    binding.status === "NET_SURFACE_BINDING_CREATED" &&
    Boolean(binding.bindingReference) &&
    Boolean(binding.registryReference) &&
    Array.isArray(binding.bindings) &&
    binding.bindings.length > 0 &&
    binding.bindings.every(entry =>
      Boolean(entry.surfaceId) &&
      Boolean(entry.envelopeReference) &&
      entry.bindingReference === binding.bindingReference,
    ) &&
    Boolean(binding.createdAt)
  );
};
