/**
 * CyberCrowd — CyberServices NET Link Runtime Adapter
 *
 * ONE JOB:
 * Bind CyberServicesNetLinkService to the existing NET connection runtime.
 *
 * Owns:
 * - Translating an accepted CyberServices NET link into NET runtime initialization
 * - Preserving the existing NET connection runtime boundary
 * - Returning the runtime initialization result
 *
 * Does NOT:
 * - Validate links
 * - Persist links
 * - Create CORE authority
 * - Create CyberServices authority
 * - Route NET operations
 * - Authenticate identity
 * - Enforce policy
 * - Modify the NET connection runtime
 * - Replace the CyberServicesNetLinkService
 */

import {
  NetConnectionRuntime
} from "./connection-runtime.js";

import type {
  CyberServicesNetLinkRecord
} from "../../../CYBERSERVICES_NET_LINK_TYPES";


export interface CyberServicesNetLinkRuntimeBindingResult {

  success: boolean;

  runtimeId: string | null;

}


export class CyberServicesNetLinkRuntimeAdapter {

  constructor(
    private readonly runtime:
      NetConnectionRuntime
  ) {}


  bind(
    link: CyberServicesNetLinkRecord
  ): CyberServicesNetLinkRuntimeBindingResult {

    const runtimeId =
      String(
        link.netLinkId ||
        link.id
      );


    const initialized =
      this.runtime.initialize({

        id: runtimeId,

        sessionReference:
          link.sessionReference,

        connectionReference:
          link.netLinkId || link.id,

        sourceReference:
          link.sourceReference,

        destinationReference:
          link.destinationReference,

        boundaryReference:
          link.boundaryReference ?? null,

        continuityReference:
          link.continuityReference ?? null,

        evidenceReference:
          link.evidenceReference ?? null

      });


    return {

      success: initialized,

      runtimeId:
        initialized
          ? runtimeId
          : null

    };

  }

}


export function createCyberServicesNetLinkRuntimeAdapter(
  runtime: NetConnectionRuntime
) {

  return new CyberServicesNetLinkRuntimeAdapter(
    runtime
  );

}
