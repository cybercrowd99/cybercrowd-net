/**
 * CyberCrowd-NET — Net Signal Binding V1
 *
 * Purpose:
 * - Bind a Sovereign NET Signal Envelope into the MDC intake boundary.
 * - Preserve deterministic NET→MDC signal lineage reference.
 * - Provide a bounded, immutable handoff membrane for metadata processing.
 *
 * Does NOT:
 * - mutate SignalPacket
 * - mutate NetSignalEnvelope
 * - own identity
 * - authorize behavior
 * - mutate CORE state
 * - mutate OSAR state
 * - mutate NET lineage
 * - execute transactions
 */

import type { NetSignalEnvelope } from "./NetSignalEnvelope";

export type NetSignalBindingStatus =
  | "NET_SIGNAL_BINDING_CREATED"
  | "NET_SIGNAL_BINDING_INVALID";

export interface NetSignalBinding {
  readonly status: NetSignalBindingStatus;

  /**
   * Immutable NET signal binding anchor.
   */
  readonly signalBindingReference: string;

  /**
   * Source NET signal envelope reference.
   */
  readonly signalEnvelopeReference: string;

  /**
   * MDC intake boundary reference.
   */
  readonly mdcReference: string;

  /**
   * Binding creation timestamp.
   */
  readonly boundAt: string;
}

export interface CreateNetSignalBindingInput {
  readonly signalEnvelope: NetSignalEnvelope;
  readonly mdcReference: string;
}

/**
 * Creates bounded NET→MDC signal binding.
 *
 * Structural binding only.
 */
export const createNetSignalBinding = (
  input: CreateNetSignalBindingInput,
): NetSignalBinding => {

  if (!input.signalEnvelope || !input.mdcReference) {
    throw new Error("INVALID_NET_SIGNAL_BINDING_INPUT");
  }

  const now =
    new Date().toISOString();

  return Object.freeze({
    status:
      "NET_SIGNAL_BINDING_CREATED",

    signalBindingReference:
      `net-signal-binding:${crypto.randomUUID()}`,

    signalEnvelopeReference:
      input.signalEnvelope.signalEnvelopeReference,

    mdcReference:
      input.mdcReference,

    boundAt:
      now,
  });
};

/**
 * Structural validation only.
 */
export const validateNetSignalBinding = (
  binding: NetSignalBinding,
): boolean => {

  return (
    binding.status === "NET_SIGNAL_BINDING_CREATED" &&
    Boolean(binding.signalBindingReference) &&
    Boolean(binding.signalEnvelopeReference) &&
    Boolean(binding.mdcReference) &&
    Boolean(binding.boundAt)
  );
};
