/**
 * CyberCrowd-NET — Net Signal Envelope V1
 *
 * Purpose:
 * - Bind a SignalPacket into the sovereign NET projection surface.
 * - Provide a bounded NET membrane for MDC-bound signal transport.
 * - Preserve deterministic NET signal lineage without altering the signal.
 *
 * Does NOT:
 * - mutate SignalPacket
 * - own identity
 * - authorize behavior
 * - mutate CORE state
 * - mutate OSAR state
 * - mutate MDC state
 * - create transactions
 */

import type { SignalPacket } from "./SignalPacket";

export type NetSignalEnvelopeStatus =
  | "NET_SIGNAL_ENVELOPE_CREATED"
  | "NET_SIGNAL_ENVELOPE_INVALID";

export interface NetSignalEnvelope {
  readonly status: NetSignalEnvelopeStatus;

  /**
   * Immutable NET signal envelope anchor.
   */
  readonly signalEnvelopeReference: string;

  /**
   * Wrapped signal packet.
   */
  readonly signal: SignalPacket;

  /**
   * Envelope creation timestamp.
   */
  readonly createdAt: string;
}

export interface CreateNetSignalEnvelopeInput {
  readonly signal: SignalPacket;
}

/**
 * Creates a bounded NET signal envelope.
 *
 * Structural wrapping only.
 */
export const createNetSignalEnvelope = (
  input: CreateNetSignalEnvelopeInput,
): NetSignalEnvelope => {

  if (!input.signal) {
    throw new Error("INVALID_NET_SIGNAL_ENVELOPE_INPUT");
  }

  const now =
    new Date().toISOString();

  return Object.freeze({
    status:
      "NET_SIGNAL_ENVELOPE_CREATED",

    signalEnvelopeReference:
      `net-signal-envelope:${crypto.randomUUID()}`,

    signal:
      Object.freeze(input.signal),

    createdAt:
      now,
  });
};

/**
 * Structural validation only.
 */
export const validateNetSignalEnvelope = (
  envelope: NetSignalEnvelope,
): boolean => {

  return (
    envelope.status === "NET_SIGNAL_ENVELOPE_CREATED" &&
    Boolean(envelope.signalEnvelopeReference) &&
    Boolean(envelope.signal) &&
    Boolean(envelope.createdAt)
  );
};
