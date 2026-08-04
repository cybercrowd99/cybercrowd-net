/**
 * CyberCrowd-NET — Net Epoch Series History V1
 *
 * Purpose:
 * - Record bounded NET epoch-series-closure anchors into immutable NET epoch-series history.
 * - Preserve deterministic NET epoch-series evolution timeline.
 * - Provide immutable epoch-series-history anchors for NET audit, replay, and lineage traversal.
 *
 * Does NOT:
 * - access CORE state
 * - access OSAR artifacts
 * - authorize behavior
 * - mutate NET epoch-series-closure lineage
 * - expose CORE internals
 */

export type NetEpochSeriesHistoryStatus =
  | "NET_EPOCH_SERIES_HISTORY_CREATED"
  | "NET_EPOCH_SERIES_HISTORY_INVALID";

export interface NetEpochSeriesHistoryEntry {
  readonly epochSeriesClosureReference: string;
  readonly epochReference: string;
  readonly epochIndex: number;
  readonly recordedAt: string;
}

export interface NetEpochSeriesHistory {
  readonly status: NetEpochSeriesHistoryStatus;

  /**
   * Immutable NET epoch-series-history anchor.
   */
  readonly epochSeriesHistoryReference: string;

  /**
   * Frozen NET epoch-series-history lineage.
   */
  readonly entries: readonly NetEpochSeriesHistoryEntry[];

  /**
   * Epoch-series-history creation timestamp.
   */
  readonly createdAt: string;
}

export interface CreateNetEpochSeriesHistoryInput {
  readonly entries: readonly {
    readonly epochSeriesClosureReference: string;
    readonly epochReference: string;
    readonly epochIndex: number;
  }[];
}

/**
 * Creates bounded NET epoch-series history.
 *
 * Structural recording only.
 */
export const createNetEpochSeriesHistory = (
  input: CreateNetEpochSeriesHistoryInput,
): NetEpochSeriesHistory => {

  const valid =
    Array.isArray(input.entries) &&
    input.entries.length > 0 &&
    input.entries.every(e =>
      Boolean(e.epochSeriesClosureReference) &&
      Boolean(e.epochReference) &&
      Number.isInteger(e.epochIndex),
    );

  if (!valid) {
    throw new Error("INVALID_NET_EPOCH_SERIES_HISTORY_INPUT");
  }

  const now =
    new Date().toISOString();

  const entries: readonly NetEpochSeriesHistoryEntry[] =
    Object.freeze(
      input.entries.map(e =>
        Object.freeze({
          epochSeriesClosureReference:
            e.epochSeriesClosureReference,

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
      "NET_EPOCH_SERIES_HISTORY_CREATED",

    epochSeriesHistoryReference:
      `net-epoch-series-history:${crypto.randomUUID()}`,

    entries,

    createdAt:
      now,
  });
};

/**
 * Structural validation only.
 */
export const validateNetEpochSeriesHistory = (
  history: NetEpochSeriesHistory,
): boolean => {

  return (
    history.status === "NET_EPOCH_SERIES_HISTORY_CREATED" &&
    Boolean(history.epochSeriesHistoryReference) &&
    Array.isArray(history.entries) &&
    history.entries.length > 0 &&
    history.entries.every(e =>
      Boolean(e.epochSeriesClosureReference) &&
      Boolean(e.epochReference) &&
      Number.isInteger(e.epochIndex) &&
      Boolean(e.recordedAt),
    ) &&
    Boolean(history.createdAt)
  );
};
