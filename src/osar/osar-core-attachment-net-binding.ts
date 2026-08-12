/**
 * CyberCrowd-Core — OSAR CORE Attachment → NET Binding V1
 *
 * ONE JOB:
 * Bind the completed OSAR → CORE attachment into the existing
 * CORE → NET boundary as an immutable structural reference.
 *
 * Structural binding only.
 *
 * This file does NOT:
 * - execute CORE behavior
 * - execute NET behavior
 * - mutate OSAR state
 * - mutate CORE state
 * - mutate NET lineage
 * - create identity
 * - create authority
 * - interpret doctrine
 * - authorize behavior
 * - execute governance
 * - expose CORE internals
 * - expose OSAR artifacts
 */

export interface OSARCoreAttachmentNetBindingInput {
  readonly attachmentReference: string;
  readonly bindingReference: string;
  readonly netHandoffReference: string;
}

export interface OSARCoreAttachmentNetBinding {
  readonly status:
    | "OSAR_CORE_ATTACHMENT_NET_BINDING_CREATED"
    | "OSAR_CORE_ATTACHMENT_NET_BINDING_INVALID";

  readonly attachmentReference: string;
  readonly bindingReference: string;
  readonly netHandoffReference: string;
  readonly bindingReferenceId: string;
  readonly createdAt: number;
}

/**
 * Creates the immutable structural binding between the completed
 * OSAR → CORE attachment and the existing CORE → NET handoff.
 */
export const createOSARCoreAttachmentNetBinding = (
  input: OSARCoreAttachmentNetBindingInput,
): OSARCoreAttachmentNetBinding => {
  const valid =
    Boolean(input.attachmentReference) &&
    Boolean(input.bindingReference) &&
    Boolean(input.netHandoffReference);

  if (!valid) {
    throw new Error(
      "INVALID_OSAR_CORE_ATTACHMENT_NET_BINDING_INPUT",
    );
  }

  const bindingReferenceId =
    `core-attachment-net-binding:${crypto.randomUUID()}`;

  return Object.freeze({
    status:
      "OSAR_CORE_ATTACHMENT_NET_BINDING_CREATED",

    attachmentReference:
      input.attachmentReference,

    bindingReference:
      input.bindingReference,

    netHandoffReference:
      input.netHandoffReference,

    bindingReferenceId,

    createdAt:
      Date.now(),
  });
};

/**
 * Structural validation only.
 *
 * Does not dereference, interpret, mutate, or execute
 * any OSAR, CORE, or NET artifact.
 */
export const validateOSARCoreAttachmentNetBinding = (
  binding: OSARCoreAttachmentNetBinding,
): boolean => {
  return (
    binding.status ===
      "OSAR_CORE_ATTACHMENT_NET_BINDING_CREATED" &&
    Boolean(binding.attachmentReference) &&
    Boolean(binding.bindingReference) &&
    Boolean(binding.netHandoffReference) &&
    Boolean(binding.bindingReferenceId) &&
    Number.isFinite(binding.createdAt)
  );
};
