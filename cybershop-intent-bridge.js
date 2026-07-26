/**
 * Repository: cybercrowd-net
 *
 * Module: CyberShopIntentBridge
 *
 * Purpose:
 * Preserve the boundary between CyberShop public surfaces
 * and CyberCrowd CORE commerce processing.
 *
 * Responsibility:
 * Capture user-facing Shop intent references before
 * controlled handoff into CORE commerce boundaries.
 *
 * Owns:
 * - intent record shape
 * - surface linkage
 * - category/action reference
 * - bridge evidence
 *
 * Does NOT own:
 * - transactions
 * - payment execution
 * - banking
 * - custody of funds
 * - fulfillment decisions
 * - financial authority
 * - identity verification
 *
 * Doctrine:
 * Shop Intent Bridge Evidence ≠ Commerce Authority
 */

function nowISO() {
  return new Date().toISOString();
}

function makeIntentId() {
  return `shop-intent.${Date.now()}.${Math.random()
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

export function createCyberShopIntent(input = {}) {
  const clean = normalizeInput(input);

  return {
    ok: true,

    intentId:
      makeIntentId(),

    surface:
      clean.surface || "shop",

    intentType:
      clean.intentType || "shop-entry",

    categoryId:
      clean.categoryId || null,

    offerId:
      clean.offerId || null,

    requestId:
      clean.requestId || null,

    customerActionId:
      clean.customerActionId || null,

    transactionId:
      clean.transactionId || null,

    state:
      clean.state || "received",

    metadata:
      safeClone(clean.metadata),

    evidence:
      safeClone(clean.evidence),

    createdAt:
      nowISO(),

    reason:
      clean.reason ||
      "CYBERSHOP_INTENT_CAPTURED",

    authorityBoundary:
      "SHOP_INTENT_BRIDGE_PRESERVES_SURFACE_INTENT_DOES_NOT_CONTROL_COMMERCE_ACTIVITY",
  };
}

export function readCyberShopIntentShape() {
  return {
    ok: true,

    name:
      "cybershop-intent-bridge",

    stage:
      "cybershop-net-entry-boundary",

    fields: [
      "intentId",
      "surface",
      "intentType",
      "categoryId",
      "offerId",
      "requestId",
      "customerActionId",
      "transactionId",
      "state",
      "metadata",
      "evidence",
      "createdAt",
      "reason",
      "authorityBoundary",
    ],

    boundary:
      "INTENT_EVIDENCE_NOT_COMMERCE_AUTHORITY",
  };
}

export const CyberShopIntentBridge = {
  createCyberShopIntent,
  readCyberShopIntentShape,
};
