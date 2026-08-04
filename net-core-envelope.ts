/**
 * CyberCrowd — Net Core Envelope V1
 *
 * Purpose:
 * - Provide a bounded, sovereign handoff membrane between the NET projection shell and CORE.
 * - Allow CORE to observe NET completion state without owning or mutating NET lineage.
 * - Bind NET completion-proof and sealed NET organs into a single interpretable envelope.
 *
 * Does NOT:
 * - access or mutate CORE internal state
 * - access or mutate OSAR artifacts
 * - authorize behavior
 * - mutate NET lineage
 * - expose internal implementation details of NET or CORE
 */

export type NetCoreEnvelopeStatus =
  | "NET_CORE_ENVELOPE_CREATED"
  | "NET_CORE_ENVELOPE_INVALID";

export interface NetCoreEnvelopeSealedOrganEntry {
  readonly organName: string;
  readonly organReference: string;
}

export interface NetCoreEnvelope {
  readonly status: NetCoreEnvelopeStatus;

  /**
   * Immutable NET→CORE envelope anchor.
   */
  readonly envelopeReference: string;

  /**
   * Sovereign NET domain reference (logical NET shell identifier).
   */
  readonly netDomainReference: string;

  /**
   * CORE structure reference (13-organ CORE interpreter identifier).
   */
  readonly coreStructureReference: string;

  /**
   * NET completion-proof anchor.
   */
  readonly netCompletionProofReference: string;

  /**
   * Frozen registry of sealed NET organs as seen by CORE.
   */
  readonly sealedOrgans: readonly NetCoreEnvelopeSealedOrganEntry[];

  /**
   * NET→CORE envelope creation timestamp.
   */
  readonly createdAt: string;
}

export interface CreateNetCoreEnvelopeInput {
  readonly netDomainReference: string;
  readonly coreStructureReference: string;
  readonly netCompletionProofReference: string;
  readonly sealedOrgans: readonly {
    readonly organName: string;
    readonly organReference: string;
  }[];
}

/**
 * Creates bounded NET→CORE envelope.
 *
 * Structural handoff only.
 */
export const createNetCoreEnvelope = (
  input: CreateNetCoreEnvelopeInput,
): NetCoreEnvelope => {

  const valid =
    Boolean(input.netDomainReference) &&
    Boolean(input.coreStructureReference) &&
    Boolean(input.netCompletionProofReference) &&
    Array.isArray(input.sealedOrgans) &&
    input.sealedOrgans.length > 0 &&
    input.sealedOrgans.every(o =>
      Boolean(o.organName) &&
      Boolean(o.organReference),
    );

  if (!valid) {
    throw new Error("INVALID_NET_CORE_ENVELOPE_INPUT");
  }

  const now =
    new Date().toISOString();

  const sealedOrgans: readonly NetCoreEnvelopeSealedOrganEntry[] =
    Object.freeze(
      input.sealedOrgans.map(o =>
        Object.freeze({
          organName:
            o.organName,

          organReference:
            o.organReference,
        }),
      ),
    );

  return Object.freeze({
    status:
      "NET_CORE_ENVELOPE_CREATED",

    envelopeReference:
      `net-core-envelope:${crypto.randomUUID()}`,

    netDomainReference:
      input.netDomainReference,

    coreStructureReference:
      input.coreStructureReference,

    netCompletionProofReference:
      input.netCompletionProofReference,

    sealedOrgans,

    createdAt:
      now,
  });
};

/**
 * Structural validation only.
 */
export const validateNetCoreEnvelope = (
  envelope: NetCoreEnvelope,
): boolean => {

  return (
    envelope.status === "NET_CORE_ENVELOPE_CREATED" &&
    Boolean(envelope.envelopeReference) &&
    Boolean(envelope.netDomainReference) &&
    Boolean(envelope.coreStructureReference) &&
    Boolean(envelope.netCompletionProofReference)
