/**
 * NET — CyberCity Surface
 *
 * NetCyberCitySurface is the passive NET-side receiving
 * boundary for CyberCity structural presence.
 *
 * It receives the CORE-exposed CyberCity surface without
 * acquiring ownership, authority, execution rights, or behavior.
 *
 * It does not:
 * - execute rotation
 * - activate wheel behavior
 * - compute rotation
 * - route connections
 * - modify CyberCity state
 * - mutate CORE continuity
 * - evaluate identity
 * - enrich place data
 * - create authority
 * - modify sovereignty
 *
 * NetCyberCitySurface only:
 * - preserves CORE-exposed CyberCity continuity
 * - establishes NET presentation presence
 * - maintains structural separation
 * - preserves non-interference doctrine
 */

import { CoreNetCyberCitySurface } from "./core-net-cybercity-surface";

export interface NetCyberCitySurface {
  /**
   * Governing NET CyberCity surface doctrine.
   */
  doctrine: "NET_CyberCitySurface";

  /**
   * Structural artifact discriminator.
   */
  status: "NET_CYBERCITY_SURFACE";

  /**
   * Preserved CORE-to-NET CyberCity surface.
   *
   * Never enriched.
   * Never modified.
   * Never interpreted.
   */
  coreSurface: CoreNetCyberCitySurface;

  /**
   * Passive NET presentation state.
   */
  surfaceState: "PRESENT";
}

/**
 * Build NET CyberCity surface artifact.
 *
 * This creates the passive NET receiving boundary
 * for CyberCity structural presence.
 *
 * It does not:
 * - expose services
 * - activate behavior
 * - route users
 * - modify CORE
 * - modify CyberCity
 * - create authority
 */
export function buildNetCyberCitySurface(
  coreSurface: CoreNetCyberCitySurface
): NetCyberCitySurface {
  const artifact: NetCyberCitySurface = {
    doctrine: "NET_CyberCitySurface",
    status: "NET_CYBERCITY_SURFACE",

    coreSurface,

    surfaceState: "PRESENT",
  };

  return Object.freeze(artifact);
}
