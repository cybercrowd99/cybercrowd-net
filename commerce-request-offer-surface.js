/**
 * Repository: cybercrowd-net
 *
 * Module: CommerceRequestOfferSurface
 *
 * Purpose:
 * Preserve the NET-facing request and offer connection
 * boundary for CyberShop.
 *
 * Responsibility:
 * Capture the visible relationship between a request
 * reference and an offer reference before CORE commerce
 * lifecycle processing.
 *
 * Owns:
 * - request/offer surface record shape
 * - request linkage
 * - offer linkage
 * - category linkage
 * - customer intent linkage
 * - provider/service references
 * - matching surface evidence
 *
 * Does NOT own:
 * - offer authority
 * - provider authority
 * - pricing decisions
 * - transaction creation
 * - payment execution
 * - fulfillment decisions
 * - dispute decisions
 * - financial authority
 *
 * Doctrine:
 * Request Offer Surface Evidence ≠ Commerce Authority
 */

function nowISO() {
  return new Date().toISOString();
}

function makeRequestOfferSurfaceId() {
  return `request-offer-surface.${Date.now()}.${Math.random()
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

export function createCommerceRequestOfferSurface(input = {}) {
  const clean = normalizeInput(input);

  return {
    ok: true,

    requestOfferSurfaceId:
      makeRequestOfferSurfaceId(),

    intentId:
      clean.intentId || null,

    categoryId:
      clean.categoryId || null,

    requestId:
      clean.requestId || null,

    offerId:
      clean.offerId || null,

    productId:
      clean.productId || null,

    serviceId:
      clean.serviceId || null,

    providerId:
      clean.providerId || null,

    surfaceType:
      clean.surfaceType || "request-offer",

    surfaceState:
      clean.surfaceState || "connected",

    metadata:
      safeClone(clean.metadata),

    evidence:
      safeClone(clean.evidence),

    createdAt:
      nowISO(),

    reason:
      clean.reason ||
      "CYBERSHOP_REQUEST_OFFER_SURFACE_CONNECTED",

    authorityBoundary:
      "REQUEST_OFFER_SURFACE_PRESERVES_CONNECTION_REFERENCE_DOES_NOT_CONTROL_COMMERCE_LIFECYCLE",
  };
}

export function readCommerceRequestOfferSurfaceShape() {
  return {
    ok: true,

    name:
      "commerce-request-offer-surface",

    stage:
      "cybershop-net-request-offer-boundary",

    fields: [
      "requestOfferSurfaceId",
      "intentId",
      "categoryId",
      "requestId",
      "offerId",
      "productId",
      "serviceId",
      "providerId",
      "surfaceType",
      "surfaceState",
      "metadata",
      "evidence",
      "createdAt",
      "reason",
      "authorityBoundary",
    ],

    boundary:
      "REQUEST_OFFER_SURFACE_EVIDENCE_NOT_COMMERCE_AUTHORITY",
  };
}

export const CommerceRequestOfferSurface = {
  createCommerceRequestOfferSurface,
  readCommerceRequestOfferSurfaceShape,
};
