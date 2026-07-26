/**
 * Repository: cybercrowd-net
 *
 * Module: ProductServicePresentationSurface
 *
 * Purpose:
 * Preserve the NET-facing presentation boundary for
 * CyberShop products and services.
 *
 * Responsibility:
 * Present product and service references after category
 * discovery while preserving a clean handoff toward CORE.
 *
 * Owns:
 * - presentation record shape
 * - product/service references
 * - category linkage
 * - display metadata
 * - presentation state
 *
 * Does NOT own:
 * - inventory authority
 * - product ownership
 * - offer creation
 * - pricing authority
 * - transaction execution
 * - payment execution
 * - fulfillment decisions
 * - financial authority
 *
 * Doctrine:
 * Presentation Evidence ≠ Commerce Authority
 */

function nowISO() {
  return new Date().toISOString();
}

function makePresentationId() {
  return `presentation.${Date.now()}.${Math.random()
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

export function createProductServicePresentation(input = {}) {
  const clean = normalizeInput(input);

  return {
    ok: true,

    presentationId:
      makePresentationId(),

    categoryId:
      clean.categoryId || null,

    intentId:
      clean.intentId || null,

    productId:
      clean.productId || null,

    serviceId:
      clean.serviceId || null,

    presentationType:
      clean.presentationType || "product-service",

    presentationState:
      clean.presentationState || "displayed",

    metadata:
      safeClone(clean.metadata),

    evidence:
      safeClone(clean.evidence),

    createdAt:
      nowISO(),

    reason:
      clean.reason ||
      "CYBERSHOP_PRODUCT_SERVICE_PRESENTED",

    authorityBoundary:
      "PRESENTATION_SURFACE_DISPLAYS_REFERENCES_DOES_NOT_CONTROL_COMMERCE_ACTIVITY",
  };
}

export function readProductServicePresentationShape() {
  return {
    ok: true,

    name:
      "product-service-presentation-surface",

    stage:
      "cybershop-net-presentation-boundary",

    fields: [
      "presentationId",
      "categoryId",
      "intentId",
      "productId",
      "serviceId",
      "presentationType",
      "presentationState",
      "metadata",
      "evidence",
      "createdAt",
      "reason",
      "authorityBoundary",
    ],

    boundary:
      "PRESENTATION_EVIDENCE_NOT_COMMERCE_AUTHORITY",
  };
}

export const ProductServicePresentationSurface = {
  createProductServicePresentation,
  readProductServicePresentationShape,
};
