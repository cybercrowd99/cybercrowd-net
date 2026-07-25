/**
 * CyberServices Net Link Registry
 *
 * ONE JOB:
 * Store and retrieve validated NET link records.
 *
 * Owns:
 * - Registering NET link records
 * - Retrieving NET link records by identity
 * - Providing NET link storage access
 *
 * Does NOT:
 * - Create links
 * - Validate links
 * - Adapt requests
 * - Route operations
 * - Expose public interfaces
 * - Execute deployments
 * - Change CORE authority
 * - Change CyberServices authority
 * - Mutate link authority
 */

import type {
  CyberServicesNetLinkRecord
} from "./CYBERSERVICES_NET_LINK_TYPES";


export interface CyberServicesNetLinkStore {

  put(
    key: string,
    value: string
  ): Promise<void>;


  get(
    key: string
  ): Promise<string | null>;
}


export class CyberServicesNetLinkRegistry {

  constructor(
    private readonly store:
      CyberServicesNetLinkStore
  ) {}


  async register(
    link: CyberServicesNetLinkRecord
  ): Promise<CyberServicesNetLinkRecord> {

    await this.store.put(
      `net-link:${link.identity.netLinkId}`,
      JSON.stringify(link)
    );

    return link;
  }


  async get(
    netLinkId: string
  ): Promise<CyberServicesNetLinkRecord | null> {

    const raw =
      await this.store.get(
        `net-link:${netLinkId}`
      );


    if (!raw) {
      return null;
    }


    try {

      return JSON.parse(
        raw
      ) as CyberServicesNetLinkRecord;

    } catch {

      return null;
    }
  }
}
