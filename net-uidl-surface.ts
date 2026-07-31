/**
 * CyberCrowd — NET uIDL Surface
 *
 * ONE JOB:
 * Provide a neutral public NET surface for uIDL references
 * without interpreting identity, intent, permissions,
 * authority, value, or meaning.
 *
 * uIDL is:
 * - structural continuity
 * - public/private boundary reference
 * - non-semantic foundation
 * - non-authoritative
 * - not a profile
 *
 * It allows:
 * - NET surfaces to expose valid uIDL references
 * - public lineage to remain intact
 * - CORE boundaries to receive structural references
 *
 * It does not:
 * - create identity
 * - describe humans
 * - infer intent
 * - grant permissions
 * - create authority
 * - calculate value
 * - expose CORE state
 * - perform routing
 */

export type NetUIDLSurfaceState =
  | "UIDL_SURFACED"
  | "UIDL_DENIED"
  | "FAILED";


export interface NetUIDLSurface {

  /**
   * Governing doctrine.
   */
  doctrine:
    "CyberCrowd_NET_UIDLSurface";


  /**
   * Structural discriminator.
   */
  status:
    "NET_UIDL_SURFACE";


  /**
   * Public uIDL reference.
   *
   * Never:
   * - interprets identity
   * - interprets intent
   * - creates authority
   * - creates value meaning
   */
  surfaceUIDL(
    uidlReference: string
  ): Promise<NetUIDLSurfaceState>;
}


/**
 * Build NET uIDL surface.
 *
 * Creates public structural surface only.
 *
 * It does not:
 * - resolve identity
 * - expose private state
 * - route CORE operations
 * - interpret users
 */
export function buildNetUIDLSurface(
  surfaceFn: (
    uidlReference: string
  ) => Promise<NetUIDLSurfaceState>
): NetUIDLSurface {

  const surface: NetUIDLSurface = {

    doctrine:
      "CyberCrowd_NET_UIDLSurface",

    status:
      "NET_UIDL_SURFACE",

    surfaceUIDL:
      surfaceFn,
  };


  return Object.freeze(surface);
}
