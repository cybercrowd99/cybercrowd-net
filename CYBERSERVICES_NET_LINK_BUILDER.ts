/**
 * CyberServices Net Link Builder
 *
 * ONE JOB:
 * Create NET link records from supplied CORE–NET linkage facts.
 *
 * Owns:
 * - Generating NET link identities
 * - Building NET link records
 * - Assigning creation timestamps
 *
 * Does NOT:
 * - Validate links
 * - Adapt requests
 * - Route operations
 * - Register links
 * - Expose public interfaces
 * - Execute deployments
 * - Change CORE authority
 * - Change CyberServices authority
 */

import type {
  CyberServicesNetLinkRecord
} from "./CYBERSERVICES_NET_LINK_TYPES";


export interface CyberServicesNetLinkInput {

  coreInterface: string;

  netInterface: string;

}


export class CyberServicesNetLinkBuilder {

  build(
    input: CyberServicesNetLinkInput
  ): CyberServicesNetLinkRecord {

    return {

      identity: {
        netLinkId: crypto.randomUUID(),
        version: "NL-1"
      },

      coreInterface:
        input.coreInterface,

      netInterface:
        input.netInterface,

      status: "CREATED",

      createdAt:
        new Date().toISOString()
    };
  }
}
