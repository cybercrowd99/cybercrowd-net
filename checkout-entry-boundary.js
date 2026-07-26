/**
 * Repository: cybercrowd-net
 *
 * Module: CheckoutEntryBoundary
 *
 * Purpose:
 * Preserve the NET-facing checkout entry boundary
 * for CyberShop.
 *
 * Responsibility:
 * Capture a user's request to enter a commerce pathway
 * after customer action selection while preserving
 * a controlled handoff toward CORE.
 *
 * Owns:
 * - checkout entry record shape
 * - action linkage
 * - intent linkage
 * - presentation linkage
 * - checkout entry evidence
 *
 * Does NOT own:
 * - transaction creation
 * - payment execution
 * - authorization decisions
 * - banking
 * - custody of funds
 * - fulfillment decisions
 * - financial authority
 *
 * Doctrine:
 * Checkout Entry Evidence ≠ Commerce Execution Authority
 */

function nowISO() {
  return new Date().toISOString();
}

function makeCheckoutEntryId() {
  return `checkout-entry.${Date.now()}.${Math.random()
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

export function createCheckoutEntry(input = {}) {
  const clean = normalizeInput(input);

  return {
    ok: true,

    checkoutEntryId:
      makeCheckoutEntryId(),

    intentId:
      clean.intentId || null,

    actionEntryId:
      clean.actionEntryId || null,

    presentationId:
      clean.presentationId || null,

    categoryId:
      clean.categoryId || null,

    productId:
      clean.productId || null,

    serviceId:
      clean.serviceId || null,

    checkoutState:
      clean.checkoutState || "requested",

    metadata:
      safeClone(clean.metadata),

    evidence:
      safeClone(clean.evidence),

    createdAt:
      nowISO(),

    reason:
      clean.reason ||
      "CYBERSHOP_CHECKOUT_ENTRY_REQUESTED",

    authorityBoundary:
      "CHECKOUT_ENTRY_BOUNDARY_RECORDS_PATHWAY_ENTRY_DOES_NOT_CONTROL_COMMERCE_EXECUTION",
  };
}

export function readCheckoutEntryBoundaryShape() {
  return {
    ok: true,

    name:
      "checkout-entry-boundary",

    stage:
      "cybershop-net-checkout-boundary",

    fields: [
      "checkoutEntryId",
      "intentId",
      "actionEntryId",
      "presentationId",
      "categoryId",
      "productId",
      "serviceId",
      "checkoutState",
      "metadata",
      "evidence",
      "createdAt",
      "reason",
      "authorityBoundary",
    ],

    boundary:
      "CHECKOUT_ENTRY_EVIDENCE_NOT_COMMERCE_EXECUTION_AUTHORITY",
  };
}

export const CheckoutEntryBoundary = {
  createCheckoutEntry,
  readCheckoutEntryBoundaryShape,
};
