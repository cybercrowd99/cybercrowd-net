/**
 * CyberCrowd-NET — Net Sovereign Closure V1
 *
 * Purpose:
 * - Seal bounded NET sovereign-ledger anchors into closed NET sovereign state.
 * - Preserve deterministic NET sovereign-chain closure.
 * - Provide immutable closure anchors for NET domain history.
 *
 * Does NOT:
 * - access CORE state
 * - access OSAR artifacts
 * - authorize behavior
 * - mutate NET sovereign-ledger lineage
 * - expose CORE internals
 */

export type NetSovereignClosureStatus =
  | "NET_SOVEREIGN_CLOSURE_CREATED"
  | "NET_SOVEREIGN_CLOSURE_INVALID";

export interface NetSovereignClosureEntry {
  readonly sovereignLedgerReference: string;
  readonly closedAt: string;
}

export interface NetSovereignClosure {
  readonly status: NetSovereignClosureStatus;

  readonly closureReference: string;

  readonly entries: readonly NetSovereignClosureEntry[];

  readonly createdAt: string;
}

export interface CreateNetSovereignClosureInput {
  readonly entries: readonly {
    readonly sovereignLedgerReference: string;
  }[];
}

export const createNetSovereignClosure = (
  input: CreateNetSovereignClosureInput,
): NetSovereignClosure => {

  const valid =
    Array.isArray(input.entries) &&
    input.entries.length > 0 &&
    input.entries.every(e =>
      Boolean(e.sovereignLedgerReference),
    );

  if (!valid) {
    throw new Error("INVALID_NET_SOVEREIGN_CLOSURE_INPUT");
  }

  const now =
    new Date().toISOString();

  const entries: readonly NetSovereignClosureEntry[] =
    Object.freeze(
      input.entries.map(e =>
        Object.freeze({
          sovereignLedgerReference:
            e.sovereignLedgerReference,
          closedAt:
            now,
        }),
      ),
    );

  return Object.freeze({
    status:
      "NET_SOVEREIGN_CLOSURE_CREATED",

    closureReference:
      `net-sovereign-closure:${crypto.randomUUID()}`,

    entries,

    createdAt:
      now,
  });
};

export const validateNetSovereignClosure = (
  closure: NetSovereignClosure,
): boolean => {

  return (
    closure.status === "NET_SOVEREIGN_CLOSURE_CREATED" &&
    Boolean(closure.closureReference) &&
    Array.isArray(closure.entries) &&
    closure.entries.length > 0 &&
    closure.entries.every(e =>
      Boolean(e.sovereignLedgerReference) &&
      Boolean(e.closedAt),
    ) &&
    Boolean(closure.createdAt)
  );
};
