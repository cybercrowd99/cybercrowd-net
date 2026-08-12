// src/net/net-capability-registration-binding.ts
// CyberCrowd — NET Capability Registration Binding
// ONE JOB: Register a NET capability into the CyberCrowd substrate lineage.

export type NetCapabilityRegistrationStatus =
  | "NET_CAPABILITY_REGISTERED"
  | "NET_CAPABILITY_REGISTRATION_INVALID";

export interface NetCapabilityRegistrationInput {
  readonly netId: string;
  readonly capabilityId: string;
  readonly capabilityReference: string;
  readonly lineage: string;
}

export interface NetCapabilityRegistrationBinding {
  readonly status: NetCapabilityRegistrationStatus;

  readonly netId: string;
  readonly capabilityId: string;
  readonly capabilityReference: string;
  readonly lineage: string;

  readonly registrationId: string;
  readonly registeredAt: number;
}

/**
 * Creates the immutable NET capability registration binding.
 */
export const createNetCapabilityRegistrationBinding = (
  input: NetCapabilityRegistrationInput,
): NetCapabilityRegistrationBinding => {
  const valid =
    Boolean(input.netId) &&
    Boolean(input.capabilityId) &&
    Boolean(input.capabilityReference) &&
    Boolean(input.lineage);

  if (!valid) {
    throw new Error("INVALID_NET_CAPABILITY_REGISTRATION_INPUT");
  }

  const registrationId =
    `net-capability-registration:${crypto.randomUUID()}`;

  return Object.freeze({
    status: "NET_CAPABILITY_REGISTERED",

    netId: input.netId,
    capabilityId: input.capabilityId,
    capabilityReference: input.capabilityReference,
    lineage: input.lineage,

    registrationId,
    registeredAt: Date.now(),
  });
};

/**
 * Structural validation only.
 */
export const validateNetCapabilityRegistrationBinding = (
  binding: NetCapabilityRegistrationBinding,
): boolean => {
  return (
    binding.status === "NET_CAPABILITY_REGISTERED" &&
    Boolean(binding.netId) &&
    Boolean(binding.capabilityId) &&
    Boolean(binding.capabilityReference) &&
    Boolean(binding.lineage) &&
    Boolean(binding.registrationId) &&
    Number.isFinite(binding.registeredAt)
  );
};
