/**
 * CyberCrowd-NET — Net Epoch Ledger V1
 *
 * Purpose:
 * - Record bounded NET epoch anchors into immutable NET epoch ledger.
 * - Preserve deterministic NET epoch audit lineage.
 * - Provide immutable epoch-ledger anchors for NET replay and verification.
 *
 * Does NOT:
 * - access CORE state
 * - access OSAR artifacts
 * - authorize behavior
 * - mutate NET epoch series lineage
 * - expose CORE internals
 */

export type NetEpochLedgerStatus =
  | "NET_EPOCH_LEDGER_CREATED"
  | "NET_EPOCH_LEDGER_INVALID";

export interface NetEpochLedgerEntry {
  readonly epochSeriesReference: string;
  readonly epochReference: string;
  readonly epochIndex: number;
  readonly recordedAt: string;
}

export interface NetEpochLedger {
  readonly status: NetEpochLedgerStatus;

  /**
   * Immutable NET epoch-ledger anchor.
   */
  readonly epochLedgerReference: string;

  /**
   * Frozen NET epoch-ledger lineage.
   */
  readonly entries: readonly NetEpochLedgerEntry[];

  /**
   * Epoch-ledger creation timestamp.
   */
  readonly createdAt: string;
}

export interface CreateNetEpochLedgerInput {
  readonly entries: readonly {
    readonly epochSeriesReference: string;
    readonly epochReference: string;
    readonly epochIndex: number;
  }[];
}

/**
 * Creates bounded NET epoch ledger.
 *
 * Structural recording only.
 */
export const createNetEpochLedger = (
  input: CreateNetEpochLedgerInput,
): NetEpochLedger => {

  const valid =
    Array.isArray(input.entries) &&
    input.entries.length > 0 &&
    input.entries.every(e =>
      Boolean(e.epochSeriesReference) &&
      Boolean(e.epochReference) &&
      Number.isInteger(e.epochIndex),
    );

  if (!valid) {
    throw new Error("INVALID_NET_EPOCH_LEDGER_INPUT");
  }

  const now =
    new Date().toISOString();

  const entries: readonly NetEpochLedgerEntry[] =
    Object.freeze(
      input.entries.map(e =>
        Object.freeze({
          epochSeriesReference:
            e.epochSeriesReference,

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
      "NET_EPOCH_LEDGER_CREATED",

    epochLedgerReference:
      `net-epoch-ledger:${crypto.randomUUID()}`,

    entries,

    createdAt:
      now,
  });
};

/**
 * Structural validation only.
 */
export const validateNetEpochLedger = (
  ledger: NetEpochLedger,
): boolean => {

  return (
    ledger.status === "NET_EPOCH_LEDGER_CREATED" &&
    Boolean(ledger.epochLedgerReference) &&
    Array.isArray(ledger.entries) &&
    ledger.entries.length > 0 &&
    ledger.entries.every(e =>
      Boolean(e.epochSeriesReference) &&
      Boolean(e.epochReference) &&
      Number.isInteger(e.epochIndex) &&
      Boolean(e.recordedAt),
    ) &&
    Boolean(ledger.createdAt)
  );
};
