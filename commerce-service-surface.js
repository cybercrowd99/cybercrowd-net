/**
 * Repository: cybercrowd-net
 *
 * Module: CommerceServiceSurface
 *
 * Purpose:
 * Preserve the NET-facing service presentation boundary
 * for CyberShop.
 *
 * Responsibility:
 * Capture visible service references connected to
 * providers, offers, categories, and request pathways.
 *
 * Owns:
 * - service surface record shape
 * - service references
 * - provider linkage
 * - offer linkage
 * - category linkage
 * - request linkage
 * - presentation metadata
 * - service surface evidence
 *
 * Does NOT own:
 * - service authority
 * - provider verification
 * - service fulfillment
 * - scheduling execution
 * - pricing authority
 * - transaction creation
 * - payment execution
 * - dispute decisions
 * - financial authority
 *
 * Doctrine:
 * Service Presentation Evidence ≠ Service Fulfillment Authority
 */

function nowISO() {
  return new Date().toISOString();
}

function makeServiceSurfaceId() {
  return `service-surface.${Date.now()}.${Math.random()
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

export function createCommerceServiceSurface(input = {}) {
  const clean = normalizeInput(input);

  return {
    ok: true,

    serviceSurfaceId:
      makeServiceSurfaceId(),

    intentId:
      clean.intentId || null,

    providerSurfaceId:
      clean.providerSurfaceId || null,

    providerId:
      clean.providerId || null,

    serviceId:
      clean.serviceId || null,

    offerId:
      clean.offerId || null,

    requestId:
      clean.requestId || null,

    categoryId:
      clean.categoryId || null,

    surfaceType:
      clean.surfaceType || "service",

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
      "CYBERSHOP_SERVICE_PRESENTED",

    authorityBoundary:
      "SERVICE_SURFACE_PRESERVES_SERVICE_REFERENCE_DOES_NOT_CONTROL_SERVICE_FULFILLMENT",
  };
}

export function readCommerceServiceSurfaceShape() {
  return {
    ok: true,

    name:
      "commerce-service-surface",

    stage:
      "cybershop-net-service-boundary",

    fields: [
      "serviceSurfaceId",
      "intentId",
      "providerSurfaceId",
      "providerId",
      "serviceId",
      "offerId",
      "requestId",
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
      "SERVICE_PRESENTATION_EVIDENCE_NOT_SERVICE_FULFILLMENT_AUTHORITY",
  };
}

export const CommerceServiceSurface = {
  createCommerceServiceSurface,
  readCommerceServiceSurfaceShape,
};
