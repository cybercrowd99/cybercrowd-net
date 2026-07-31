/**
 * CyberCrowd — NET uIDL Reference
 *
 * ONE JOB:
 * Define the neutral public NET-side uIDL reference artifact.
 *
 * uIDL is:
 * - structural continuity
 * - lineage reference
 * - public/private boundary marker
 * - non-semantic
 * - non-authoritative
 *
 * It allows:
 * - NET surfaces to carry stable uIDL references
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
 * - route operations
 * - expose private CORE state
 */


export type NetUIDLReferenceVisibility =
  | "PUBLIC"
  | "PRIVATE_REFERENCE";


export type NetUIDLReferenceVersion =
  | "UIDL-1";


export interface NetUIDLReferenceIdentity {

  referenceId: string;

  version: NetUIDLReferenceVersion;

}


export interface NetUIDLReference {

  /**
   * Structural reference identity.
   */
  identity:
    NetUIDLReferenceIdentity;


  /**
   * Visibility boundary.
   *
   * This does not determine access.
   * It only declares structural visibility.
   */
  visibility:
    NetUIDLReferenceVisibility;


  /**
   * Lineage timestamp.
   */
  createdAt:
    string;
}


/**
 * Create a neutral NET uIDL reference.
 *
 * Creates structure only.
 *
 * It does not:
 * - identify a person
 * - assign meaning
 * - create authority
 * - create value
 */
export function createNetUIDLReference(
  visibility:
    NetUIDLReferenceVisibility
): NetUIDLReference {

  return {

    identity: {

      referenceId:
        crypto.randomUUID(),

      version:
        "UIDL-1"
    },


    visibility,


    createdAt:
      new Date().toISOString()
  };
}
