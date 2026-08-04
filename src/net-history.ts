/**
 * CyberCrowd-NET — Net History Organ V1
 *
 * Purpose:
 * - Record bounded NET sovereign-closure anchors into immutable NET history.
 * - Preserve deterministic NET domain evolution timeline.
 * - Provide immutable history anchors for NET audit and replay.
 *
 * Does NOT:
 * - access CORE state
 * - access OSAR artifacts
 * - authorize behavior
 * - mutate NET sovereign-closure lineage
 * - expose CORE internals
 */

export type NetHistoryStatus =
  | "NET_HISTORY_CREATED"
  | "NET_HISTORY_INVALID";

export interface NetHistoryEntry {
  readonly closureReference: string;
  readonly sovereignLedgerReference: string;
  readonly recordedAt: string;
}

export interface NetHistory {
  readonly status: NetHistoryStatus;

  /**
   * Immutable NET history anchor.
   */
  readonly historyReference: string;

  /**
   * Frozen NET history lineage.
   */
  readonly entries: readonly NetHistoryEntry[];

  /**
   * History creation timestamp.
   */
  readonly createdAt: string;
}

export interface CreateNetHistoryInput {
  readonly entries: readonly {
    readonly closureReference: string;
    readonly sovereignLedgerReference: string;
  }[];
}

/**
 * Creates bounded NET history.
 *
 * Structural recording only.
 */
export const createNetHistory = (
  input: CreateNetHistoryInput,
): NetHistory => {

  const valid =
    Array.isArray(input.entries) &&
    input.entries.length > 0 &&
    input.entries.every(e =>
      Boolean(e.closureReference) &&
      Boolean(e.sovereignLedgerReference),
    );

  if (!valid) {
    throw new Error("INVALID_NET_HISTORY_INPUT");
  }

  const now =
    new Date().toISOString();

  const entries: readonly NetHistoryEntry[] =
    Object.freeze(
      input.entries.map(e =>
        Object.freeze({
          closureReference:
            e.closureReference,

          sovereignLedgerReference:
            e.sovereignLedgerReference,

          recordedAt:
            now,
        }),
      ),
    );

  return Object.freeze({
    status:
      "NET_HISTORY_CREATED",

    historyReference:
      `net-history:${crypto.randomUUID()}`,

    entries,

    createdAt:
      now,
  });
};

/**
 * Structural validation only.
 */
export const validateNetHistory = (
  history: NetHistory,
): boolean => {

  return (
    history.status === "NET_HISTORY_CREATED" &&
    Boolean(history.historyReference) &&
    Array.isArray(history.entries) &&
    history.entries.length > 0 &&
    history.entries.every(e =>
      Boolean(e.closureReference) &&
      Boolean(e.sovereignLedgerReference) &&
      Boolean(e.recordedAt),
    ) &&
    Boolean(history.createdAt)
  );
};
