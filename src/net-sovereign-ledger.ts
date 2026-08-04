/**
 * CyberCrowd-NET — Net Sovereign Ledger V1
 *
 * Purpose:
 * - Record bounded NET surface-finality anchors.
 * - Preserve deterministic NET sovereign lineage.
 * - Provide immutable sovereign ledger anchors for NET domain.
 *
 * Does NOT:
 * - access CORE state
 * - access OSAR artifacts
 * - authorize behavior
 * - mutate NET finality lineage
 * - expose CORE internals
 */

export type NetSovereignLedgerStatus =
  | "NET_SOVEREIGN_LEDGER_CREATED"
  | "NET_SOVEREIGN_LEDGER_INVALID";

export interface NetSovereignLedgerEntry {
  readonly finalityReference: string;
  readonly ledgerReference: string;
}

export interface NetSovereignLedger {
  readonly status: NetSovereignLedgerStatus;

  /**
   * Immutable NET sovereign ledger anchor.
   */
  readonly sovereignLedgerReference: string;

  /**
   * Frozen list of NET sovereign entries.
   */
  readonly entries: readonly NetSovereignLedgerEntry[];

  /**
   * Ledger creation timestamp.
   */
  readonly createdAt: string;
}

export interface CreateNetSovereignLedgerInput {
  readonly entries: readonly {
    readonly finalityReference: string;
    readonly ledgerReference: string;
  }[];
}

/**
 * Creates bounded NET sovereign ledger.
 *
 * Structural recording only.
 */
export const createNetSovereignLedger = (
  input: CreateNetSovereignLedgerInput,
): NetSovereignLedger => {

  const valid =
    Array.isArray(input.entries) &&
    input.entries.length > 0 &&
    input.entries.every(e =>
      Boolean(e.finalityReference) &&
      Boolean(e.ledgerReference),
    );

  if (!valid) {
    throw new Error("INVALID_NET_SOVEREIGN_LEDGER_INPUT");
  }

  return Object.freeze({
    status:
      "NET_SOVEREIGN_LEDGER_CREATED",

    sovereignLedgerReference:
      `net-sovereign-ledger:${crypto.randomUUID()}`,

    entries:
      Object.freeze([...input.entries]),

    createdAt:
      new Date().toISOString(),
  });
};

/**
 * Structural validation only.
 */
export const validateNetSovereignLedger = (
  ledger: NetSovereignLedger,
): boolean => {

  return (
    ledger.status === "NET_SOVEREIGN_LEDGER_CREATED" &&
    Boolean(ledger.sovereignLedgerReference) &&
    Array.isArray(ledger.entries) &&
    ledger.entries.length > 0 &&
    ledger.entries.every(e =>
      Boolean(e.finalityReference) &&
      Boolean(e.ledgerReference),
    ) &&
    Boolean(ledger.createdAt)
  );
};
