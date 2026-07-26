/**
 * Repository: cybercrowd-net
 *
 * Module: CommerceProviderSurface
 *
 * Purpose:
 * Preserve the NET-facing provider presentation boundary
 * for CyberShop.
 *
 * Responsibility:
 * Present provider references connected to services,
 * offers, and request/offer pathways while preserving
 * a controlled handoff toward CORE.
 *
 * Owns:
 * - provider surface record shape
 * - provider references
 * - service linkage
 * - offer linkage
 * - request linkage
 * - presentation metadata
 * - provider surface evidence
 *
 * Does NOT own:
 * - provider authority
 * - provider identity verification
 * - service fulfillment
 * - offer ownership
 * - pricing decisions
 * - transaction creation
 * - payment execution
 * - dispute decisions
 * - financial authority
 *
 * Doctrine:
 * Provider Presentation Evidence ≠ Provider Authority
 */

function nowISO() {
  return new Date().toISOString();
}

function makeProviderSurfaceId() {
  return `provider-surface.${Date.now()}.${Math.random()
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

export function createCommerceProviderSurface(input = {}) {
  const clean = normalizeInput(input);

  return {
    ok: true,

    providerSurfaceId:
      makeProviderSurfaceId(),

    intentId:
      clean.intentId || null,

    requestOfferSurfaceId:
      clean.requestOfferSurfaceId || null,

    providerId:
      clean.providerId || null,

    serviceId:
      clean.serviceId || null,

    offerId:
      clean.offerId || null,

    categoryId:
      clean.categoryId || null,

    surfaceType:
      clean.surfaceType || "provider",

    surfaceState:
      clean.surfaceState || "presented",

    metadata:
      safeClone(clean.metadata),

    evidence:
      safeClone(clean.evidence),

    createdAt:
      nowISO(),

    reason:
      clean.reason ||
      "CYBERSHOP_PROVIDER_PRESENTED",

    authorityBoundary:
      "PROVIDER_SURFACE_PRESERVES_PROVIDER_REFERENCE_DOES_NOT_CONTROL_PROVIDER_ACTIVITY",
  };
}

export function readCommerceProviderSurfaceShape() {
  return {
    ok: true,

    name:
      "commerce-provider-surface",

    stage:
      "cybershop-net-provider-boundary",

    fields: [
      "providerSurfaceId",
      "intentId",
      "requestOfferSurfaceId",
      "providerId",
      "serviceId",
      "offerId",
      "categoryId",
      "surfaceType",
      "surfaceState",
      "metadata",
      "evidence",
      "createdAt",
      "reason",
      "authorityBoundary",
    ],

    boundary:
      "PROVIDER_PRESENTATION_EVIDENCE_NOT_PROVIDER_AUTHORITY",
  };
}

export const CommerceProviderSurface = {
  createCommerceProviderSurface,
  readCommerceProviderSurfaceShape,
};
