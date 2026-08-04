/**
 * CyberCrowd-NET — Net Epoch Closure V1
 *
 * Purpose:
 * - Seal bounded NET epoch-ledger anchors into closed NET epoch state.
 * - Preserve deterministic NET epoch-chain closure.
 * - Provide immutable epoch-closure anchors for NET audit, replay, and lineage sealing.
 *
 * Does NOT:
 * - access CORE state
 * - access OSAR artifacts
 * - authorize behavior
 * - mutate NET epoch-ledger lineage
 * - expose CORE internals
 */

export type NetEpochClosureStatus =
  | "NET_EPOCH_CLOSURE_CREATED"
  | "NET_EPOCH_CLOSURE_INVALID";

export interface NetEpochClosureEntry {
  readonly epochLedgerReference: string;
  readonly epochReference: string;
  readonly epochIndex: number;
  readonly closedAt: string;
}

export interface NetEpochClosure {
  readonly status: NetEpochClosureStatus;

  /**
   * Immutable NET epoch-closure anchor.
   */
  readonly epochClosureReference: string;

  /**
   * Frozen NET epoch-closure lineage.
   */
  readonly entries: readonly NetEpochClosureEntry[];

  /**
   * Epoch-closure creation timestamp.
   */
  readonly createdAt: string;
}

export interface CreateNetEpochClosureInput {
  readonly entries: readonly {
    readonly epochLedgerReference: string;
    readonly epochReference: string;
    readonly epochIndex: number;
  }[];
}

/**
 * Creates bounded NET epoch closure.
 *
 * Structural sealing only.
 */
export const createNetEpochClosure = (
  input: CreateNetEpochClosureInput,
): NetEpochClosure => {

  const valid =
    Array.isArray(input.entries) &&
    input.entries.length > 0 &&
    input.entries.every(e =>
      Boolean(e.epochLedgerReference) &&
      Boolean(e.epochReference) &&
      Number.isInteger(e.epochIndex),
    );

  if (!valid) {
    throw new Error("INVALID_NET_EPOCH_CLOSURE_INPUT");
  }

  const now =
    new Date().toISOString();

  const entries: readonly NetEpochClosureEntry[] =
    Object.freeze(
      input.entries.map(e =>
        Object.freeze({
          epochLedgerReference:
            e.epochLedgerReference,

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
      "NET_EPOCH_CLOSURE_CREATED",

    epochClosureReference:
      `net-epoch-closure:${crypto.randomUUID()}`,

    entries,

    createdAt:
      now,
  });
};

/**
 * Structural validation only.
 */
export const validateNetEpochClosure = (
  closure: NetEpochClosure,
): boolean => {

  return (
    closure.status === "NET_EPOCH_CLOSURE_CREATED" &&
    Boolean(closure.epochClosureReference) &&
    Array.isArray(closure.entries) &&
    closure.entries.length > 0 &&
    closure.entries.every(e =>
      Boolean(e.epochLedgerReference) &&
      Boolean(e.epochReference) &&
      Number.isInteger(e.epochIndex) &&
      Boolean(e.closedAt),
    ) &&
    Boolean(closure.createdAt)
  );
};
