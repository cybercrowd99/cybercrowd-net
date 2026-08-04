/**
 * CyberCrowd-NET — Net Surface Finality V1
 *
 * Purpose:
 * - Seal bounded NET surface-availability ledger entries.
 * - Preserve deterministic NET surface finality.
 * - Provide immutable finality anchors for NET surface lineage.
 *
 * Does NOT:
 * - access CORE state
 * - access OSAR artifacts
 * - mutate NET availability ledger entries
 * - authorize behavior
 * - expose CORE surfaces
 */

export type NetSurfaceFinalityStatus =
  | "SURFACE_FINALITY_CREATED"
  | "SURFACE_FINALITY_INVALID";

export interface NetSurfaceFinality {
  readonly status: NetSurfaceFinalityStatus;

  readonly finalityReference: string;

  readonly ledgerReference: string;

  readonly availability: {
    readonly surfaceReference: string;
    readonly envelopeReference: string;
    readonly availability:
      | "SURFACE_AVAILABLE"
      | "SURFACE_BLOCKED"
      | "SURFACE_REVIEW_REQUIRED";
  };

  readonly createdAt: string;
}

export interface CreateNetSurfaceFinalityInput {
  readonly ledgerReference: string;

  readonly availability: {
    readonly surfaceReference: string;
    readonly envelopeReference: string;
    readonly availability:
      | "SURFACE_AVAILABLE"
      | "SURFACE_BLOCKED"
      | "SURFACE_REVIEW_REQUIRED";
  };
}

export const createNetSurfaceFinality = (
  input: CreateNetSurfaceFinalityInput,
): NetSurfaceFinality => {

  const valid =
    Boolean(input.ledgerReference) &&
    Boolean(input.availability.surfaceReference) &&
    Boolean(input.availability.envelopeReference);

  if (!valid) {
    throw new Error("INVALID_NET_SURFACE_FINALITY_INPUT");
  }

  return Object.freeze({
    status: "SURFACE_FINALITY_CREATED",

    finalityReference:
      `net-surface-finality:${crypto.randomUUID()}`,

    ledgerReference:
      input.ledgerReference,

    availability:
      Object.freeze({ ...input.availability }),

    createdAt:
      new Date().toISOString(),
  });
};

export const validateNetSurfaceFinality = (
  finality: NetSurfaceFinality,
): boolean => {

  return (
    finality.status === "SURFACE_FINALITY_CREATED" &&
    Boolean(finality.finalityReference) &&
    Boolean(finality.ledgerReference) &&
    Boolean(finality.availability.surfaceReference) &&
    Boolean(finality.availability.envelopeReference) &&
    Boolean(finality.createdAt)
  );
};
