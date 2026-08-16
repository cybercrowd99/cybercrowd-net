/**
 * CyberServices NET Link Runtime Binding
 *
 * ONE JOB:
 * Bind the existing CyberServices NET link service boundary to the
 * existing NET connection runtime adapter.
 *
 * This file is a composition boundary.
 *
 * It does NOT:
 *
 * - Validate links
 * - Persist links
 * - Create links
 * - Adapt link records
 * - Modify the NET connection runtime
 * - Create CORE authority
 * - Create CyberServices authority
 * - Authenticate identity
 * - Enforce policy
 * - Route NET operations
 * - Deploy infrastructure
 *
 * The binding connects already-declared responsibilities without
 * taking ownership of those responsibilities.
 */

import {
  CyberServicesNetLinkService
} from "./CYBERSERVICES_NET_LINK_SERVICE";

import {
  CyberServicesNetLinkRuntimeAdapter
} from "./cyberservices-net-link-runtime-adapter";

export interface CyberServicesNetLinkRuntimeBinding {

  service:
    CyberServicesNetLinkService;

  runtimeAdapter:
    CyberServicesNetLinkRuntimeAdapter;

}

export function createCyberServicesNetLinkRuntimeBinding({
  service,
  runtimeAdapter
}: CyberServicesNetLinkRuntimeBinding): CyberServicesNetLinkRuntimeBinding {

  return {
    service,
    runtimeAdapter
  };

}
