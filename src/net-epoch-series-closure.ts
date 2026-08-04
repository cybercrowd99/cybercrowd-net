/**
 * CyberCrowd-NET — Net Epoch Series Closure V1
 *
 * Purpose:
 * - Seal bounded NET epoch-history anchors into closed NET epoch-series state.
 * - Preserve deterministic NET epoch-series closure lineage.
 * - Provide immutable epoch-series-closure anchors for NET audit, replay, and time-bounded verification.
 *
 * Does NOT:
 * - access CORE state
 * - access OSAR artifacts
 * - authorize behavior
 * - mutate NET epoch-history lineage
 * - expose CORE internals
 */

export type NetEpochSeriesClosureStatus =
  | "NET_EPOCH_SERIES_CLOSURE_CREATED"
  | "NET_EPOCH_SERIES_CLOSURE_INVALID";

export interface NetEpochSeriesClosureEntry {
  readonly epochHistoryReference: string;
  readonly epochReference: string;
  readonly epochIndex: number;
  readonly closedAt: string;
}

export interface NetEpochSeriesClosure {
  readonly status: NetEpochSeriesClosureStatus;

  /**
   * Immutable NET epoch-series-closure anchor.
   */
  readonly epochSeriesClosureReference: string;

  /**
   * Frozen NET epoch-series-closure lineage.
   */
  readonly entries: readonly NetEpochSeriesClosureEntry[];

  /**
   * Epoch-series-closure creation timestamp.
   */
  readonly createdAt: string;
}

export interface CreateNetEpochSeriesClosureInput {
  readonly entries: readonly {
    readonly epochHistoryReference: string;
    readonly epochReference: string;
    readonly epochIndex: number;
  }[];
}

/**
 * Creates bounded NET epoch-series closure.
 *
 * Structural sealing only.
 */
export const createNetEpochSeriesClosure = (
  input: CreateNetEpochSeriesClosureInput,
): NetEpochSeriesClosure => {

  const valid =
    Array.isArray(input.entries) &&
    input.entries.length > 0 &&
    input.entries.every(e =>
      Boolean(e.epochHistoryReference) &&
      Boolean(e.epochReference) &&
      Number.isInteger(e.epochIndex),
    );

  if (!valid) {
    throw new Error("INVALID_NET_EPOCH_SERIES_CLOSURE_INPUT");
  }

  const now =
    new Date().toISOString();

  const entries: readonly NetEpochSeriesClosureEntry[] =
    Object.freeze(
      input.entries.map(e =>
        Object.freeze({
          epochHistoryReference:
            e.epochHistoryReference,

          epochReference:
            e.epochReference,

          epochIndex:
            e.epochIndex,

          closedAt:
            now,
        }),
      ),
    );

  return Object.freeze({
    status:
      "NET_EPOCH_SERIES_CLOSURE_CREATED",

    epochSeriesClosureReference:
      `net-epoch-series-closure:${crypto.randomUUID()}`,

    entries,

    createdAt:
      now,
  });
};

/**
 * Structural validation only.
 */
export const validateNetEpochSeriesClosure = (
  closure: NetEpochSeriesClosure,
): boolean => {

  return (
    closure.status === "NET_EPOCH_SERIES_CLOSURE_CREATED" &&
    Boolean(closure.epochSeriesClosureReference) &&
    Array.isArray(closure.entries) &&
    closure.entries.length > 0 &&
    closure.entries.every(e =>
      Boolean(e.epochHistoryReference) &&
      Boolean(e.epochReference) &&
      Number.isInteger(e.epochIndex) &&
      Boolean(e.closedAt),
    ) &&
    Boolean(closure.createdAt)
  );
};
