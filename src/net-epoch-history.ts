/**
 * CyberCrowd-NET — Net Epoch History Organ V1
 *
 * Purpose:
 * - Record bounded NET epoch-closure anchors into immutable NET epoch history.
 * - Preserve deterministic NET epoch evolution timeline.
 * - Provide immutable epoch-history anchors for NET audit, replay, and lineage traversal.
 *
 * Does NOT:
 * - access CORE state
 * - access OSAR artifacts
 * - authorize behavior
 * - mutate NET epoch-closure lineage
 * - expose CORE internals
 */

export type NetEpochHistoryStatus =
  | "NET_EPOCH_HISTORY_CREATED"
  | "NET_EPOCH_HISTORY_INVALID";

export interface NetEpochHistoryEntry {
  readonly epochClosureReference: string;
  readonly epochReference: string;
  readonly epochIndex: number;
  readonly recordedAt: string;
}

export interface NetEpochHistory {
  readonly status: NetEpochHistoryStatus;

  /**
   * Immutable NET epoch-history anchor.
   */
  readonly epochHistoryReference: string;

  /**
   * Frozen NET epoch-history lineage.
   */
  readonly entries: readonly NetEpochHistoryEntry[];

  /**
   * Epoch-history creation timestamp.
   */
  readonly createdAt: string;
}

export interface CreateNetEpochHistoryInput {
  readonly entries: readonly {
    readonly epochClosureReference: string;
    readonly epochReference: string;
    readonly epochIndex: number;
  }[];
}

/**
 * Creates bounded NET epoch history.
 *
 * Structural recording only.
 */
export const createNetEpochHistory = (
  input: CreateNetEpochHistoryInput,
): NetEpochHistory => {

  const valid =
    Array.isArray(input.entries) &&
    input.entries.length > 0 &&
    input.entries.every(e =>
      Boolean(e.epochClosureReference) &&
      Boolean(e.epochReference) &&
      Number.isInteger(e.epochIndex),
    );

  if (!valid) {
    throw new Error("INVALID_NET_EPOCH_HISTORY_INPUT");
  }

  const now =
    new Date().toISOString();

  const entries: readonly NetEpochHistoryEntry[] =
    Object.freeze(
      input.entries.map(e =>
        Object.freeze({
          epochClosureReference:
            e.epochClosureReference,

          epochReference:
            e.epochReference,

          epochIndex:
            e.epochIndex,

          recordedAt:
            now,
        }),
      ),
    );

  return Object.freeze({
    status:
      "NET_EPOCH_HISTORY_CREATED",

    epochHistoryReference:
      `net-epoch-history:${crypto.randomUUID()}`,

    entries,

    createdAt:
      now,
  });
};

/**
 * Structural validation only.
 */
export const validateNetEpochHistory = (
  history: NetEpochHistory,
): boolean => {

  return (
    history.status === "NET_EPOCH_HISTORY_CREATED" &&
    Boolean(history.epochHistoryReference) &&
    Array.isArray(history.entries) &&
    history.entries.length > 0 &&
    history.entries.every(e =>
      Boolean(e.epochClosureReference) &&
      Boolean(e.epochReference) &&
      Number.isInteger(e.epochIndex) &&
      Boolean(e.recordedAt),
    ) &&
    Boolean(history.createdAt)
  );
};
