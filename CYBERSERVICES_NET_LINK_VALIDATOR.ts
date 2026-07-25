/**
 * CyberServices Net Link Validator
 *
 * ONE JOB:
 * Validate NET link records for structural correctness.
 *
 * Owns:
 * - Checking required NET link fields
 * - Checking NL-1 version compatibility
 * - Returning validation results
 *
 * Does NOT:
 * - Create links
 * - Adapt requests
 * - Route operations
 * - Register links
 * - Expose public interfaces
 * - Execute deployments
 * - Change CORE authority
 * - Change CyberServices authority
 * - Mutate link records
 */

import type {
  CyberServicesNetLinkRecord,
  CyberServicesNetLinkResult
} from "./CYBERSERVICES_NET_LINK_TYPES";


export class CyberServicesNetLinkValidator {

  validate(
    link: CyberServicesNetLinkRecord
  ): CyberServicesNetLinkResult {

    const reasons: string[] = [];


    if (!link.identity.netLinkId) {
      reasons.push("MISSING_NET_LINK_ID");
    }


    if (!link.identity.version) {
      reasons.push("MISSING_VERSION");
    }


    if (link.identity.version !== "NL-1") {
      reasons.push("UNSUPPORTED_VERSION");
    }


    if (!link.coreInterface) {
      reasons.push("MISSING_CORE_INTERFACE");
    }


    if (!link.netInterface) {
      reasons.push("MISSING_NET_INTERFACE");
    }


    if (!link.createdAt) {
      reasons.push("MISSING_CREATED_AT");
    }


    return {
      success: reasons.length === 0,
      link
    };
  }
}
