// src/net/net-capability-binding.ts
// CyberCrowd — NET Capability Binding
// ONE JOB: Declare NET capability identity inside the CyberCrowd substrate.

export type NetCapabilityBindingStatus =
  | "NET_CAPABILITY_BOUND"
  | "NET_CAPABILITY_INVALID";

export interface NetCapabilityBindingInput {
  readonly netId: string;
  readonly capabilityId: string;
  readonly capabilityReference: string;
}

export interface NetCapabilityBinding {
  readonly status: NetCapabilityBindingStatus;

  readonly netId: string;
  readonly capabilityId: string;
  readonly capabilityReference: string;

  readonly capabilityBindingId: string;
  readonly boundAt: number;
}

/**
 * Creates the immutable NET capability binding.
 */
export const createNetCapabilityBinding = (
  input: NetCapabilityBindingInput,
): NetCapabilityBinding => {
  const valid =
    Boolean(input.netId) &&
    Boolean(input.capabilityId) &&
    Boolean(input.capabilityReference);

  if (!valid) {
    throw new Error("INVALID_NET_CAPABILITY_BINDING_INPUT");
  }

  const capabilityBindingId =
    `net-capability-binding:${crypto.randomUUID()}`;

  return Object.freeze({
    status: "NET_CAPABILITY_BOUND",

    netId: input.netId,
    capabilityId: input.capabilityId,
    capabilityReference: input.capabilityReference,

    capabilityBindingId,
    boundAt: Date.now(),
  });
};

/**
 * Structural validation only.
 */
export const validateNetCapabilityBinding = (
  binding: NetCapabilityBinding,
): boolean => {
  return (
    binding.status === "NET_CAPABILITY_BOUND" &&
    Boolean(binding.netId) &&
    Boolean(binding.capabilityId) &&
    Boolean(binding.capabilityReference) &&
    Boolean(binding.capabilityBindingId) &&
    Number.isFinite(binding.boundAt)
  );
};
