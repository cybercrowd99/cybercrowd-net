/**
 * CyberCrowd-Core — NET Projection Boundary
 *
 * Purpose:
 * - Provide the bounded CORE → NET translation boundary.
 * - Allow only CORE-approved structural projections to reach NET.
 * - Preserve sovereign separation between operational logic and public surfaces.
 *
 * Does NOT:
 * - create identity
 * - create ownership
 * - expose OSAR artifacts
 * - expose dissolved content
 * - track behavior
 * - authorize actions
 * - mutate CORE state
 */

export type NetProjectionBoundaryStatus =
  | "NET_PROJECTION_ALLOWED"
  | "NET_PROJECTION_BLOCKED"
  | "NET_PROJECTION_REVIEW_REQUIRED";

export interface CoreNetProjectionRequest {
  readonly artifactReference: string;
  readonly canProjectToNet: boolean;
}

export interface NetProjectionBoundaryResult {
  readonly status: NetProjectionBoundaryStatus;
  readonly projectionReference: string;
}

/**
 * Translate CORE projection eligibility into a NET boundary decision.
 *
 * Structural boundary evaluation only.
 */
export const evaluateNetProjectionBoundary = (
  request: CoreNetProjectionRequest,
): NetProjectionBoundaryResult => {
  if (!request.artifactReference) {
    throw new Error("INVALID_NET_PROJECTION_REFERENCE");
  }

  const status: NetProjectionBoundaryStatus =
    request.canProjectToNet
      ? "NET_PROJECTION_ALLOWED"
      : "NET_PROJECTION_BLOCKED";

  return Object.freeze({
    status,
    projectionReference:
      `net-projection:${crypto.randomUUID()}`,
  });
};

/**
 * Structural validation only.
 */
export const validateNetProjectionBoundaryResult = (
  result: NetProjectionBoundaryResult,
): boolean => {
  return (
    Boolean(result.projectionReference) &&
    (
      result.status === "NET_PROJECTION_ALLOWED" ||
      result.status === "NET_PROJECTION_BLOCKED" ||
      result.status === "NET_PROJECTION_REVIEW_REQUIRED"
    )
  );
};
