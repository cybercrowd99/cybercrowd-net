/**
 * CyberCrowd-MDC — Ledger Entry V1
 *
 * Purpose:
 * - Create bounded MDC ledger entries from registered MDC events.
 * - Preserve event registry references.
 * - Provide immutable ledger intake structure for MDC archival flow.
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

import type { MdcEventRegistry } from "./MdcEventRegistry";

export type MdcLedgerEntryStatus =
  | "MDC_LEDGER_ENTRY_CREATED"
  | "MDC_LEDGER_ENTRY_INVALID";

export interface MdcLedgerEntry {
  readonly status: MdcLedgerEntryStatus;

  /**
   * Immutable MDC ledger entry reference.
   */
  readonly ledgerEntryReference: string;

  /**
   * Source MDC event registry reference.
   */
  readonly registryReference: string;

  /**
   * Event references included in ledger entry.
   */
  readonly eventReferences: readonly string[];

  /**
   * Ledger entry creation timestamp.
   */
  readonly createdAt: string;
}

export interface CreateMdcLedgerEntryInput {
  readonly registry: MdcEventRegistry;
}

/**
 * Creates bounded MDC ledger entry.
 *
 * Structural ledger creation only.
 */
export const createMdcLedgerEntry = (
  input: CreateMdcLedgerEntryInput,
): MdcLedgerEntry => {

  const valid =
    Boolean(input.registry) &&
    input.registry.status === "MDC_EVENT_REGISTRY_CREATED" &&
    Boolean(input.registry.registryReference) &&
    Array.isArray(input.registry.eventReferences) &&
    input.registry.eventReferences.length > 0 &&
    input.registry.eventReferences.every(Boolean);

  if (!valid) {
    throw new Error("INVALID_MDC_LEDGER_ENTRY_INPUT");
  }

  const now =
    new Date().toISOString();

  return Object.freeze({
    status:
      "MDC_LEDGER_ENTRY_CREATED",

    ledgerEntryReference:
      `mdc-ledger-entry:${crypto.randomUUID()}`,

    registryReference:
      input.registry.registryReference,

    eventReferences:
      Object.freeze(
        [...input.registry.eventReferences],
      ),

    createdAt:
      now,
  });
};

/**
 * Structural validation only.
 */
export const validateMdcLedgerEntry = (
  entry: MdcLedgerEntry,
): boolean => {

  return (
    entry.status === "MDC_LEDGER_ENTRY_CREATED" &&
    Boolean(entry.ledgerEntryReference) &&
    Boolean(entry.registryReference) &&
    Array.isArray(entry.eventReferences) &&
    entry.eventReferences.length > 0 &&
    entry.eventReferences.every(Boolean) &&
    Boolean(entry.createdAt)
  );
};
