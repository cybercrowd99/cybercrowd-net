/**
 * Repository: cybercrowd-net
 *
 * Module: CyberShopCategorySurface
 *
 * Purpose:
 * Preserve the NET-facing category discovery boundary
 * for CyberShop.
 *
 * Responsibility:
 * Present category references and preserve
 * category selection intent before CORE processing.
 *
 * Owns:
 * - category surface shape
 * - discovery references
 * - category selection evidence
 *
 * Does NOT own:
 * - category authority
 * - product inventory
 * - offer ownership
 * - transaction execution
 * - payment execution
 * - fulfillment decisions
 * - financial authority
 *
 * Doctrine:
 * Category Discovery Evidence ≠ Commerce Authority
 */

function nowISO() {
  return new Date().toISOString();
}

function makeCategorySelectionId() {
  return `category-selection.${Date.now()}.${Math.random()
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

export function createCategorySelection(input = {}) {
  const clean = normalizeInput(input);

  return {
    ok: true,

    categorySelectionId:
      makeCategorySelectionId(),

    surface:
      clean.surface || "shop",

    categoryId:
      clean.categoryId || null,

    categoryName:
      clean.categoryName || null,

    discoveryState:
      clean.discoveryState || "selected",

    intentId:
      clean.intentId || null,

    metadata:
      safeClone(clean.metadata),

    evidence:
      safeClone(clean.evidence),

    createdAt:
      nowISO(),

    reason:
      clean.reason ||
      "CYBERSHOP_CATEGORY_SELECTED",

    authorityBoundary:
      "CATEGORY_SURFACE_PRESERVES_DISCOVERY_REFERENCE_DOES_NOT_CONTROL_COMMERCE_ACTIVITY",
  };
}

export function readCyberShopCategorySurfaceShape() {
  return {
    ok: true,

    name:
      "cybershop-category-surface",

    stage:
      "cybershop-net-discovery-boundary",

    fields: [
      "categorySelectionId",
      "surface",
      "categoryId",
      "categoryName",
      "discoveryState",
      "intentId",
      "metadata",
      "evidence",
      "createdAt",
      "reason",
      "authorityBoundary",
    ],

    boundary:
      "CATEGORY_DISCOVERY_NOT_COMMERCE_AUTHORITY",
  };
}

export const CyberShopCategorySurface = {
  createCategorySelection,
  readCyberShopCategorySurfaceShape,
};
