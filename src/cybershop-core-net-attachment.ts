/**
 * CYBERCROWD NET
 *
 * CyberShop CORE → NET Attachment
 *
 * ONE JOB:
 * Provide the structural attachment between the completed CyberShop
 * CORE handoff surface and the NET layer.
 *
 * Boundary:
 *
 *   CyberShop CORE Handoff
 *             │
 *             ▼
 *   CORE → NET Attachment
 *             │
 *             ▼
 *          CyberShop NET
 *
 * This module does not:
 * - execute CORE behavior
 * - execute NET behavior
 * - mutate CORE
 * - mutate CyberShop
 * - create identity
 * - establish authority
 * - create provenance
 * - create lineage
 * - perform commerce operations
 * - interpret commerce lifecycle
 * - create runtime Cloudflare bindings
 *
 * It only preserves the declared structural connection between the
 * completed CORE handoff and the NET layer.
 */

export type CyberShopCoreNetAttachment = Readonly<{
  core: unknown;
  layer: "NET";
}>;

/**
 * Attach the completed CyberShop CORE handoff to NET.
 *
 * The supplied CORE handoff remains the source of its own declared
 * structure. This function does not modify or reinterpret it.
 */
export function createCyberShopCoreNetAttachment(
  core: unknown,
): CyberShopCoreNetAttachment {
  return Object.freeze({
    core,
    layer: "NET",
  });
}
