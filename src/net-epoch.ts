/**
 * CyberCrowd-NET — Net Epoch Organ V1
 *
 * Purpose:
 * - Segment immutable NET history into bounded NET epochs.
 * - Preserve deterministic NET domain epoch lineage.
 * - Provide immutable epoch anchors for NET replay, audit, and time slicing.
 *
 * Does NOT:
 * - access CORE state
 * - access OSAR artifacts
 * - authorize behavior
 * - mutate NET history lineage
 * - expose CORE internals
 */

export type NetEpochStatus =
  | "NET_EPOCH_CREATED"
  | "NET_EPOCH_INVALID";

export interface NetEpochEntry {
  readonly historyReference: string;
  readonly epochIndex: number;
  readonly epochReference: string;
  readonly slicedAt: string;
}

export interface NetEpoch {
  readonly status: NetEpochStatus;

  /**
   * Immutable NET epoch anchor.
   */
  readonly epochSeriesReference: string;

  /**
   * Frozen NET epoch lineage.
   */
  readonly epochs: readonly NetEpochEntry[];

  /**
   * Epoch series creation timestamp.
   */
  readonly createdAt: string;
}

export interface CreateNetEpochInput {
  readonly historyReferences: readonly string[];
}

/**
 * Creates bounded NET epoch series.
 *
 * Structural segmentation only.
 */
export const createNetEpoch = (
  input: CreateNetEpochInput,
): NetEpoch => {

  const valid =
    Array.isArray(input.historyReferences) &&
    input.historyReferences.length > 0 &&
    input.historyReferences.every(ref => Boolean(ref));

  if (!valid) {
    throw new Error("INVALID_NET_EPOCH_INPUT");
  }

  const now =
    new Date().toISOString();

  const epochs: readonly NetEpochEntry[] =
    Object.freeze(
      input.historyReferences.map((ref, index) =>
        Object.freeze({
          historyReference: ref,

          epochIndex: index,

          epochReference:
            `net-epoch:${crypto.randomUUID()}`,

          slicedAt:
            now,
        }),
      ),
    );

  return Object.freeze({
    status:
      "NET_EPOCH_CREATED",

    epochSeriesReference:
      `net-epoch-series:${crypto.randomUUID()}`,

    epochs,

    createdAt:
      now,
  });
};

/**
 * Structural validation only.
 */
export const validateNetEpoch = (
  epoch: NetEpoch,
): boolean => {

  return (
    epoch.status === "NET_EPOCH_CREATED" &&
    Boolean(epoch.epochSeriesReference) &&
    Array.isArray(epoch.epochs) &&
    epoch.epochs.length > 0 &&
    epoch.epochs.every(e =>
      Boolean(e.historyReference) &&
      Number.isInteger(e.epochIndex) &&
      Boolean(e.epochReference) &&
      Boolean(e.slicedAt),
    ) &&
    Boolean(epoch.createdAt)
  );
};
