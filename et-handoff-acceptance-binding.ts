/**
 * CyberCrowd-Net — CORE → NET Handoff Acceptance Binding V1
 *
 * ONE JOB:
 * Accept the declared CORE → NET handoff reference into
 * NET lineage as an immutable structural acceptance anchor.
 *
 * Structural binding only.
 *
 * This file does NOT:
 * - execute NET behavior
 * - execute CORE behavior
 * - mutate CORE state
 * - mutate OSAR state
 * - mutate NET lineage contents
 * - create identity
 * - create authority
 * - interpret doctrine
 * - authorize behavior
 * - execute governance
 * - expose CORE internals
 */

export type NetHandoffAcceptanceStatus =
  | "NET_HANDOFF_ACCEPTANCE_CREATED"
  | "NET_HANDOFF_ACCEPTANCE_INVALID";

export interface NetHandoffAcceptanceBindingInput {
  readonly netHandoffReference: string;
  readonly coreAttachmentReference: string;
  readonly coreBindingReference: string;
}

export interface NetHandoffAcceptanceBinding {
  readonly status: NetHandoffAcceptanceStatus;

  /**
   * Immutable reference to the CORE → NET handoff.
   */
  readonly netHandoffReference: string;

  /**
   * Immutable reference to the CORE-side attachment.
   */
  readonly coreAttachmentReference: string;

  /**
   * Immutable reference to the OSAR → CORE binding.
   */
  readonly coreBindingReference: string;

  /**
   * Immutable NET-side acceptance anchor.
   */
  readonly netAcceptanceAnchor: string;

  /**
   * Creation timestamp for the structural acceptance binding.
   */
  readonly acceptedAt: number;
}

/**
 * Creates the immutable NET-side acceptance binding
 * for a declared CORE → NET handoff.
 *
 * Structural binding only.
 */
export const createNetHandoffAcceptanceBinding = (
  input: NetHandoffAcceptanceBindingInput,
): NetHandoffAcceptanceBinding => {
  const valid =
    Boolean(input.netHandoffReference) &&
    Boolean(input.coreAttachmentReference) &&
    Boolean(input.coreBindingReference);

  if (!valid) {
    throw new Error(
      "INVALID_NET_HANDOFF_ACCEPTANCE_BINDING_INPUT",
    );
  }

  const netAcceptanceAnchor =
    `net-handoff-acceptance:${crypto.randomUUID()}`;

  return Object.freeze({
    status: "NET_HANDOFF_ACCEPTANCE_CREATED",

    netHandoffReference:
      input.netHandoffReference,

    coreAttachmentReference:
      input.coreAttachmentReference,

    coreBindingReference:
      input.coreBindingReference,

    netAcceptanceAnchor,

    acceptedAt: Date.now(),
  });
};

/**
 * Structural validation only.
 *
 * Does not dereference, interpret, mutate, or execute
 * any CORE or NET artifact.
 */
export const validateNetHandoffAcceptanceBinding = (
  binding: NetHandoffAcceptanceBinding,
): boolean => {
  return (
    binding.status ===
      "NET_HANDOFF_ACCEPTANCE_CREATED" &&
    Boolean(binding.netHandoffReference) &&
    Boolean(binding.coreAttachmentReference) &&
    Boolean(binding.coreBindingReference) &&
    Boolean(binding.netAcceptanceAnchor) &&
    Number.isFinite(binding.acceptedAt)
  );
};
