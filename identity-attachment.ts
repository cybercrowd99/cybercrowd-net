/**
 * FILE ACTION: CREATE NEW FILE
 * FILE: identity-attachment.ts
 * REPO: cybercrowd99/uIDL-User-Identification-Digital-Landing
 * COMMIT: Add uIDL identity attachment primitive
 * CONTEXT: Define one passive attachment beneath a root uIDL.
 *
 * No registry.
 * No storage.
 * No verifier execution.
 * No capability execution.
 * No relationship execution.
 * No password handling.
 * No authorization.
 */

/**
 * uIDL — Identity Attachment
 *
 * IdentityAttachment is the universal passive structural shell
 * for something attached beneath one sovereign uIDL origin.
 *
 * It may represent:
 *
 * - private lane
 * - professional lane
 * - alias
 * - business
 * - object
 * - camera
 * - event
 * - archive
 * - device
 * - sub-lane
 * - future attachment type
 *
 * It does not:
 *
 * - create the root uIDL
 * - replace the root uIDL
 * - authenticate the human
 * - verify a password
 * - verify a four-digit code
 * - grant capability
 * - create authority
 * - create ownership
 * - execute relationships
 * - store registry contents
 * - mutate external systems
 *
 * It only:
 *
 * - identifies one attachment
 * - preserves its root origin reference
 * - preserves its structural parent reference
 * - declares its attachment type
 * - declares its namespace
 * - declares its lifecycle state
 * - declares its verifier policy
 * - points outward to separate registries
 */

export type AttachmentType =
  | "PRIVATE_LANE"
  | "PROFESSIONAL_LANE"
  | "ALIAS"
  | "BUSINESS"
  | "OBJECT"
  | "CAMERA"
  | "EVENT"
  | "ARCHIVE"
  | "DEVICE"
  | "SUB_LANE"
  | "FUTURE";

export type AttachmentState =
  | "ACTIVE"
  | "SUSPENDED"
  | "REVOKED"
  | "ARCHIVED";

export type AttachmentVerifierPolicy =
  | "NONE"
  | "OPTIONAL"
  | "REQUIRED";

/**
 * Passive uIDL attachment artifact.
 *
 * Root origin remains sovereign.
 *
 * Parentage is structural lineage only.
 *
 * Parentage does not automatically create:
 *
 * - ownership
 * - authority
 * - capability
 * - access
 * - identity
 */
export interface IdentityAttachment {
  /**
   * Governing uIDL doctrine.
   */
  doctrine: "CyberCity_uIDL_IdentityAttachment";

  /**
   * Structural artifact discriminator.
   */
  status: "UIDL_IDENTITY_ATTACHMENT";

  /**
   * Opaque identifier for this attachment only.
   */
  attachmentId: string;

  /**
   * Sovereign root uIDL reference.
   *
   * Every attachment resolves to one root origin.
   *
   * This reference does not contain:
   *
   * - password
   * - verifier secret
   * - human description
   */
  rootUidl: string;

  /**
   * Structural parent attachment.
   *
   * Null means the attachment is directly registered
   * beneath the root uIDL.
   *
   * A parent reference does not imply ownership.
   */
  parentId: string | null;

  /**
   * Declares what structural class this attachment represents.
   */
  attachmentType: AttachmentType;

  /**
   * Neutral structural namespace.
   *
   * Example grammar:
   *
   * root/u123/private
   * root/u123/professional
   * root/u123/business
   * root/u123/object
   *
   * This is structural addressing only.
   * It does not grant access.
   */
  namespace: string;

  /**
   * Optional human-visible label.
   *
   * Example:
   *
   * Smoking BBQ
   * One-EyedLegend
   * Professional RN
   *
   * The label is not identity authority.
   */
  displayName?: string;

  /**
   * Attachment lifecycle state.
   */
  state: AttachmentState;

  /**
   * Declares whether this attachment expects
   * a separate scoped verifier relationship.
   *
   * This field does not perform verification.
   */
  verifierPolicy: AttachmentVerifierPolicy;

  /**
   * Optional reference to a separately owned verifier record.
   *
   * Never stores the verifier secret here.
   */
  verifierReference?: string;

  /**
   * Reference to a separately owned relationship registry.
   *
   * The attachment does not embed an expanding relationship list.
   */
  relationshipRegistryReference?: string;

  /**
   * Reference to a separately owned capability registry.
   *
   * The attachment does not embed an expanding capability list.
   */
  capabilityRegistryReference?: string;

  /**
   * Immutable structural creation timestamp.
   */
  createdAt: string;
}

/**
 * Build one passive IdentityAttachment.
 *
 * This function creates structure only.
 *
 * It does not:
 *
 * - register the attachment
 * - persist the attachment
 * - resolve the root
 * - verify parentage
 * - activate a verifier
 * - grant capability
 * - establish relationships
 * - authorize access
 */
export function buildIdentityAttachment(
  attachmentId: string,
  rootUidl: string,
  parentId: string | null,
  attachmentType: AttachmentType,
  namespace: string,
  state: AttachmentState,
  verifierPolicy: AttachmentVerifierPolicy,
  createdAt: string,
  displayName?: string,
  verifierReference?: string,
  relationshipRegistryReference?: string,
  capabilityRegistryReference?: string
): IdentityAttachment {
  const artifact: IdentityAttachment = {
    doctrine: "CyberCity_uIDL_IdentityAttachment",

    status: "UIDL_IDENTITY_ATTACHMENT",

    attachmentId,

    rootUidl,

    parentId,

    attachmentType,

    namespace,

    state,

    verifierPolicy,

    createdAt,

    ...(displayName !== undefined
      ? { displayName }
      : {}),

    ...(verifierReference !== undefined
      ? { verifierReference }
      : {}),

    ...(relationshipRegistryReference !== undefined
      ? { relationshipRegistryReference }
      : {}),

    ...(capabilityRegistryReference !== undefined
      ? { capabilityRegistryReference }
      : {}),
  };

  return Object.freeze(artifact);
}
