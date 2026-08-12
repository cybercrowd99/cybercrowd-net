/**
 * CyberCrowd-Net — NET Lineage Consolidation Binding V1
 *
 * ONE JOB:
 * Consolidate a registered NET lineage event into the NET lineage spine
 * as an immutable structural consolidation anchor.
 *
 * Structural consolidation only.
 *
 * This file does NOT:
 * - execute NET behavior
 * - mutate NET lineage contents
 * - mutate CORE state
 * - mutate OSAR state
 * - interpret doctrine
 * - authorize behavior
 * - execute governance
 * - expose CORE internals
 */

export type NetLineageConsolidationStatus =
  | "NET_LINEAGE_CONSOLIDATION_CREATED"
  | "NET_LINEAGE_CONSOLIDATION_INVALID";

export interface NetLineageConsolidationInput {
  readonly netLineageEventId: string;
  readonly netAcceptanceAnchor: string;
  readonly coreBindingReference: string;
}

export interface NetLineageConsolidationBinding {
  readonly status: NetLineageConsolidationStatus;

  readonly netLineageEventId: string;
  readonly netAcceptanceAnchor: string;
  readonly coreBindingReference: string;

  readonly netLineageConsolidationId: string;
  readonly consolidatedAt: number;
}

/**
 * Creates the immutable NET lineage consolidation binding
 * for a registered NET lineage event.
 */
export const createNetLineageConsolidationBinding = (
  input: NetLineageConsolidationInput,
): NetLineageConsolidationBinding => {
  const valid =
    Boolean(input.netLineageEventId) &&
    Boolean(input.netAcceptanceAnchor) &&
    Boolean(input.coreBindingReference);

  if (!valid) {
    throw new Error(
      "INVALID_NET_LINEAGE_CONSOLIDATION_INPUT",
    );
  }

  const netLineageConsolidationId =
    `net-lineage-consolidation:${crypto.randomUUID()}`;

  return Object.freeze({
    status: "NET_LINEAGE_CONSOLIDATION_CREATED",

    netLineageEventId: input.netLineageEventId,
    netAcceptanceAnchor: input.netAcceptanceAnchor,
    coreBindingReference: input.coreBindingReference,

    netLineageConsolidationId,
    consolidatedAt: Date.now(),
  });
};

/**
 * Structural validation only.
 */
export const validateNetLineageConsolidationBinding = (
  binding: NetLineageConsolidationBinding,
): boolean => {
  return (
    binding.status === "NET_LINEAGE_CONSOLIDATION_CREATED" &&
    Boolean(binding.netLineageEventId) &&
    Boolean(binding.netAcceptanceAnchor) &&
    Boolean(binding.coreBindingReference) &&
    Boolean(binding.netLineageConsolidationId) &&
    Number.isFinite(binding.consolidatedAt)
  );
};
