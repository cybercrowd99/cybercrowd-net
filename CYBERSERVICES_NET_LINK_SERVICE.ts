/**
 * CyberServices Net Link Service
 *
 * ONE JOB:
 * Provide a stable service boundary for NET link handling.
 *
 * Owns:
 * - Accepting NET link requests
 * - Delegating link validation
 * - Delegating link persistence
 * - Returning deterministic service results
 *
 * Does NOT:
 * - Create links
 * - Validate links internally
 * - Adapt requests
 * - Route operations
 * - Expose public interfaces
 * - Execute deployments
 * - Change CORE authority
 * - Change CyberServices authority
 * - Mutate link authority
 */

import type {
  CyberServicesNetLinkRecord,
  CyberServicesNetLinkResult
} from "./CYBERSERVICES_NET_LINK_TYPES";


export interface CyberServicesNetLinkValidatorPort {

  validate(
    link: CyberServicesNetLinkRecord
  ): CyberServicesNetLinkResult;

}


export interface CyberServicesNetLinkRegistryPort {

  register(
    link: CyberServicesNetLinkRecord
  ): Promise<CyberServicesNetLinkRecord>;


  get(
    netLinkId: string
  ): Promise<CyberServicesNetLinkRecord | null>;

}


export interface CyberServicesNetLinkServiceResult {

  success: boolean;

  validation: CyberServicesNetLinkResult;

  stored?: CyberServicesNetLinkRecord | null;

}


export class CyberServicesNetLinkService {

  constructor(
    private readonly validator:
      CyberServicesNetLinkValidatorPort,

    private readonly registry:
      CyberServicesNetLinkRegistryPort
  ) {}


  async handle(
    link: CyberServicesNetLinkRecord
  ): Promise<CyberServicesNetLinkServiceResult> {

    const validation =
      this.validator.validate(link);


    if (!validation.success) {

      return {
        success: false,
        validation
      };

    }


    const stored =
      await this.registry.register(link);


    return {
      success: true,
      validation,
      stored
    };

  }

}
