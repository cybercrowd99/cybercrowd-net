/**
 * CyberCrowd-MDC — Ledger Registry V1
 *
 * Purpose:
 * - Register bounded MDC ledger entries.
 * - Preserve ledger entry references.
 * - Provide immutable MDC ledger registry layer.
 *
 * Does NOT:
 * - own identity
 * - create behavioral profiles
 * - mutate NET lineage
 * - mutate CORE state
 * - mutate OSAR state
 * - authorize behavior
 * - execute transactions
 */

import type { MdcLedgerEntry } from "./MdcLedgerEntry";

export type MdcLedgerRegistryStatus =
  | "MDC_LEDGER_REGISTRY_CREATED"
  | "MDC_LEDGER_REGISTRY_INVALID";

export interface MdcLedgerRegistry {
  readonly status: MdcLedgerRegistryStatus;

  /**
   * Immutable MDC ledger registry reference.
   */
  readonly registryReference: string;

  /**
   * Registered ledger entry references.
   */
  readonly ledgerEntryReferences: readonly string[];

  /**
   * Registry creation timestamp.
   */
  readonly createdAt: string;
}

export interface CreateMdcLedgerRegistryInput {
  readonly entries: readonly MdcLedgerEntry[];
}

/**
 * Creates bounded MDC ledger registry.
 *
 * Structural registration only.
 */
export const createMdcLedgerRegistry = (
  input: CreateMdcLedgerRegistryInput,
): MdcLedgerRegistry => {

  const valid =
    Array.isArray(input.entries) &&
    input.entries.length > 0 &&
    input.entries.every(entry =>
      entry.status === "MDC_LEDGER_ENTRY_CREATED" &&
      Boolean(entry.ledgerEntryReference),
    );

  if (!valid) {
    throw new Error("INVALID_MDC_LEDGER_REGISTRY_INPUT");
  }

  const now =
    new Date().toISOString();

  return Object.freeze({
    status:
      "MDC_LEDGER_REGISTRY_CREATED",

    registryReference:
      `mdc-ledger-registry:${crypto.randomUUID()}`,

    ledgerEntryReferences:
      Object.freeze(
        input.entries.map(entry =>
          entry.ledgerEntryReference,
        ),
      ),

    createdAt:
      now,
  });
};

/**
 * Structural validation only.
 */
export const validateMdcLedgerRegistry = (
  registry: MdcLedgerRegistry,
): boolean => {

  return (
    registry.status === "MDC_LEDGER_REGISTRY_CREATED" &&
    Boolean(registry.registryReference) &&
    Array.isArray(registry.ledgerEntryReferences) &&
    registry.ledgerEntryReferences.length > 0 &&
    registry.ledgerEntryReferences.every(Boolean) &&
    Boolean(registry.createdAt)
  );
};
