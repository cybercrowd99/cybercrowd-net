/**
 * CyberCrowd-NET — Net Projection Envelope
 *
 * Purpose:
 * - Receive CORE-approved handoff signals.
 * - Create a bounded NET-safe projection envelope.
 * - Preserve the CORE → NET separation boundary.
 *
 * Does NOT:
 * - inspect OSAR artifacts
 * - create identity
 * - create ownership
 * - create authority
 * - track behavior
 * - store interaction history
 * - mutate CORE state
 */

export type NetProjectionEnvelopeStatus =
  | "NET_ENVELOPE_READY"
  | "NET_ENVELOPE_BLOCKED"
  | "NET_ENVELOPE_REVIEW_REQUIRED";

export interface CoreProjectionHandoffInput {
  readonly status:
    | "HANDOFF_READY"
    | "HANDOFF_BLOCKED"
    | "HANDOFF_REVIEW_REQUIRED";

  readonly handoffReference: string;
  readonly projectionReference: string;
}

export interface NetProjectionEnvelope {
  readonly status:
    NetProjectionEnvelopeStatus;

  /**
   * CORE handoff anchor.
   */
  readonly handoffReference:
    string;

  /**
   * NET envelope anchor.
   */
  readonly envelopeReference:
    string;

  /**
   * Creation timestamp.
   */
  readonly createdAt:
    string;
}

/**
 * Creates a NET-safe projection envelope.
 *
 * Translation only.
 */
export const createNetProjectionEnvelope = (
  handoff: CoreProjectionHandoffInput,
): NetProjectionEnvelope => {

  if (
    !handoff.handoffReference ||
    !handoff.projectionReference
  ) {
    throw new Error(
      "INVALID_CORE_PROJECTION_HANDOFF"
    );
  }

  const status:
    NetProjectionEnvelopeStatus =
      handoff.status === "HANDOFF_READY"
        ? "NET_ENVELOPE_READY"
        : handoff.status === "HANDOFF_BLOCKED"
          ? "NET_ENVELOPE_BLOCKED"
          : "NET_ENVELOPE_REVIEW_REQUIRED";

  return Object.freeze({
    status,

    handoffReference:
      handoff.handoffReference,

    envelopeReference:
      `net-envelope:${crypto.randomUUID()}`,

    createdAt:
      new Date().toISOString(),
  });
};

/**
 * Structural validation only.
 */
export const validateNetProjectionEnvelope = (
  envelope: NetProjectionEnvelope,
): boolean => {

  return (
    Boolean(envelope.handoffReference) &&
    Boolean(envelope.envelopeReference) &&
    Boolean(envelope.createdAt) &&
    (
      envelope.status === "NET_ENVELOPE_READY" ||
      envelope.status === "NET_ENVELOPE_BLOCKED" ||
      envelope.status === "NET_ENVELOPE_REVIEW_REQUIRED"
    )
  );
};
