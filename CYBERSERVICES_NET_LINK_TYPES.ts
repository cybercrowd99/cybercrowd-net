/**
 * CyberServices Net Link Types
 *
 * ONE JOB:
 * Define stable linkage data contracts between CORE and NET.
 *
 * Owns:
 * - NET link identities
 * - NET link record shapes
 * - NET link status vocabulary
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
 */


export type CyberServicesNetLinkStatus =
  | "CREATED"
  | "CONNECTED"
  | "ACTIVE"
  | "DISABLED";


export type CyberServicesNetLinkVersion =
  | "NL-1";


export interface CyberServicesNetLinkIdentity {

  netLinkId: string;

  version: CyberServicesNetLinkVersion;

}


export interface CyberServicesNetLinkRecord {

  identity: CyberServicesNetLinkIdentity;

  coreInterface: string;

  netInterface: string;

  status: CyberServicesNetLinkStatus;

  createdAt: string;

}


export interface CyberServicesNetLinkResult {

  success: boolean;

  link: CyberServicesNetLinkRecord;

}
