/**
 * Repository: cybercrowd-net
 *
 * Module: CustomerActionEntrySurface
 *
 * Purpose:
 * Preserve the NET-facing customer action entry boundary
 * for CyberShop.
 *
 * Responsibility:
 * Capture user-selected action references after product
 * or service presentation and preserve a controlled
 * handoff toward CORE CustomerAction processing.
 *
 * Owns:
 * - action entry record shape
 * - presentation linkage
 * - intent linkage
 * - selected action reference
 * - entry metadata
 * - action entry evidence
 *
 * Does NOT own:
 * - CORE CustomerAction lifecycle
 * - transaction creation
 * - checkout execution
 * - payment execution
 * - fulfillment decisions
 * - dispute decisions
 * - financial authority
 *
 * Doctrine:
 * Customer Action Entry Evidence ≠ Commerce Decision
 */

function nowISO() {
  return new Date().toISOString();
}

function makeActionEntryId() {
  return `customer-action-entry.${Date.now()}.${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function safeClone(value) {
  if (value === undefined || value === null) {
    return null;
  }

  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return null;
  }
}

function normalizeInput(input = {}) {
  if (!input || typeof input !== "object") {
    return {};
  }

  return input;
}

export function createCustomerActionEntry(input = {}) {
  const clean = normalizeInput(input);

  return {
    ok: true,

    actionEntryId:
      makeActionEntryId(),

    intentId:
      clean.intentId || null,

    presentationId:
      clean.presentationId || null,

    categoryId:
      clean.categoryId || null,

    productId:
      clean.productId || null,

    serviceId:
      clean.serviceId || null,

    actionType:
      clean.actionType || "interest",

    actionState:
      clean.actionState || "entered",

    metadata:
      safeClone(clean.metadata),

    evidence:
      safeClone(clean.evidence),

    createdAt:
      nowISO(),

    reason:
      clean.reason ||
      "CYBERSHOP_CUSTOMER_ACTION_ENTRY_CAPTURED",

    authorityBoundary:
      "CUSTOMER_ACTION_ENTRY_SURFACE_PRESERVES_ACTION_REFERENCE_DOES_NOT_CONTROL_COMMERCE_LIFECYCLE",
  };
}

export function readCustomerActionEntryShape() {
  return {
    ok: true,

    name:
      "customer-action-entry-surface",

    stage:
      "cybershop-net-action-boundary",

    fields: [
      "actionEntryId",
      "intentId",
      "presentationId",
      "categoryId",
      "productId",
      "serviceId",
      "actionType",
      "actionState",
      "metadata",
      "evidence",
      "createdAt",
      "reason",
      "authorityBoundary",
    ],

    boundary:
      "CUSTOMER_ACTION_ENTRY_EVIDENCE_NOT_COMMERCE_DECISION",
  };
}

export const CustomerActionEntrySurface = {
  createCustomerActionEntry,
  readCustomerActionEntryShape,
};
