/**
 * CyberCrowd-Net — NET Lineage Registration Binding V1
 *
 * ONE JOB:
 * Register the accepted CORE → NET handoff into NET lineage
 * as an immutable structural lineage event.
 *
 * Structural registration only.
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

export type NetLineageRegistrationStatus =
  | "NET_LINEAGE_REGISTRATION_CREATED"
  | "NET_LINEAGE_REGISTRATION_INVALID";

export interface NetLineageRegistrationInput {
  readonly netAcceptanceAnchor: string;
  readonly netHandoffReference: string;
  readonly coreBindingReference: string;
}

export interface NetLineageRegistrationBinding {
  readonly status: NetLineageRegistrationStatus;

  readonly netAcceptanceAnchor: string;
  readonly netHandoffReference: string;
  readonly coreBindingReference: string;

  readonly netLineageEventId: string;
  readonly registeredAt: number;
}

/**
 * Creates the immutable NET lineage registration event
 * for the accepted CORE → NET handoff.
 */
export const createNetLineageRegistrationBinding = (
  input: NetLineageRegistrationInput,
): NetLineageRegistrationBinding => {
  const valid =
    Boolean(input.netAcceptanceAnchor) &&
    Boolean(input.netHandoffReference) &&
    Boolean(input.coreBindingReference);

  if (!valid) {
    throw new Error(
      "INVALID_NET_LINEAGE_REGISTRATION_INPUT",
    );
  }

  const netLineageEventId =
    `net-lineage-event:${crypto.randomUUID()}`;

  return Object.freeze({
    status: "NET_LINEAGE_REGISTRATION_CREATED",

    netAcceptanceAnchor: input.netAcceptanceAnchor,
    netHandoffReference: input.netHandoffReference,
    coreBindingReference: input.coreBindingReference,

    netLineageEventId,
    registeredAt: Date.now(),
  });
};

/**
 * Structural validation only.
 */
export const validateNetLineageRegistrationBinding = (
  binding: NetLineageRegistrationBinding,
): boolean => {
  return (
    binding.status === "NET_LINEAGE_REGISTRATION_CREATED" &&
    Boolean(binding.netAcceptanceAnchor) &&
    Boolean(binding.netHandoffReference) &&
    Boolean(binding.coreBindingReference) &&
    Boolean(binding.netLineageEventId) &&
    Number.isFinite(binding.registeredAt)
  );
};
