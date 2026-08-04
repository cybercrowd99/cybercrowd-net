/**
 * CyberCrowd-NET — Net Surface Projection
 *
 * Purpose:
 * - Convert a valid NET projection envelope into a bounded surface projection.
 * - Represent only approved public-surface availability.
 *
 * Does NOT:
 * - access CORE state
 * - access OSAR artifacts
 * - create identity
 * - create ownership
 * - track behavior
 * - store interaction history
 * - authorize actions
 */

export type NetSurfaceProjectionStatus =
  | "SURFACE_AVAILABLE"
  | "SURFACE_BLOCKED"
  | "SURFACE_REVIEW_REQUIRED";

export interface NetProjectionEnvelopeInput {
  readonly status:
    | "NET_ENVELOPE_READY"
    | "NET_ENVELOPE_BLOCKED"
    | "NET_ENVELOPE_REVIEW_REQUIRED";

  readonly envelopeReference: string;
}

export interface NetSurfaceProjection {
  readonly status:
    NetSurfaceProjectionStatus;

  /**
   * NET envelope anchor.
   */
  readonly envelopeReference:
    string;

  /**
   * Surface projection reference.
   */
  readonly surfaceReference:
    string;

  /**
   * Creation timestamp.
   */
  readonly createdAt:
    string;
}

/**
 * Create NET surface projection.
 *
 * Structural surface translation only.
 */
export const createNetSurfaceProjection = (
  envelope: NetProjectionEnvelopeInput,
): NetSurfaceProjection => {

  if (!envelope.envelopeReference) {
    throw new Error(
      "INVALID_NET_SURFACE_ENVELOPE"
    );
  }

  const status:
    NetSurfaceProjectionStatus =
      envelope.status === "NET_ENVELOPE_READY"
        ? "SURFACE_AVAILABLE"
        : envelope.status === "NET_ENVELOPE_BLOCKED"
          ? "SURFACE_BLOCKED"
          : "SURFACE_REVIEW_REQUIRED";

  return Object.freeze({
    status,

    envelopeReference:
      envelope.envelopeReference,

    surfaceReference:
      `surface:${crypto.randomUUID()}`,

    createdAt:
      new Date().toISOString(),
  });
};

/**
 * Structural validation only.
 */
export const validateNetSurfaceProjection = (
  projection: NetSurfaceProjection,
): boolean => {

  return (
    Boolean(projection.envelopeReference) &&
    Boolean(projection.surfaceReference) &&
    Boolean(projection.createdAt) &&
    (
      projection.status === "SURFACE_AVAILABLE" ||
      projection.status === "SURFACE_BLOCKED" ||
      projection.status === "SURFACE_REVIEW_REQUIRED"
    )
  );
};
