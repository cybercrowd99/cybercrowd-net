/* ============================================================
   [NET]
   CyberCrowd NET

   File:
   integration/mdc-request-router.ts

   Purpose:
   Defines the NET-side routing layer for directing
   CyberCrowd surface requests toward the MDC Link Client.

   Owns:
   - NET request classification
   - MDC target selection
   - request normalization
   - linkage handoff

   Does NOT own:
   - metadata storage
   - MDC authority
   - permission decisions
   - proof generation
   - ledger writes
   - lineage changes

   Boundary:

   NET PAGE / SURFACE
          |
          ▼
   MDC REQUEST ROUTER
          |
          ▼
    MDC LINK CLIENT
          |
          ▼
   MDC SERVICE CONTRACT

   Core Rule:

   NET decides what it needs to ask for.
   MDC decides what it can expose.

   ============================================================ */


import {
  CyberCrowdMDCLinkClient,
  MDCLinkRequest,
  MDCAccessTarget
} from "./mdc-link-client";



export interface MDCNetRouteRequest {

  source:
    string;

  target:
    MDCAccessTarget;

  reference:
    string;

}



export interface MDCNetRouteResult {

  request:
    MDCLinkRequest;

  source:
    string;

  routed_at:
    number;

}



export class MDCRequestRouter {


  route(
    input: MDCNetRouteRequest
  ): MDCNetRouteResult {


    const request =
      CyberCrowdMDCLinkClient.request(
        input.target,
        input.reference
      );


    return Object.freeze({

      request,

      source:
        cleanId(
          input.source
        ),

      routed_at:
        Date.now()

    });

  }



  routeBatch(
    inputs:
      readonly MDCNetRouteRequest[]
  ): readonly MDCNetRouteResult[] {


    if (
      !Array.isArray(inputs)
    ) {

      return [];

    }


    return Object.freeze(

      inputs.map(
        (input) =>
          this.route(input)
      )

    );

  }


}



export const CyberCrowdMDCRequestRouter =
  new MDCRequestRouter();




function cleanId(
  value: unknown
): string {


  if (
    typeof value !== "string" &&
    typeof value !== "number"
  ) {

    return "";

  }


  return String(value)
    .trim()
    .slice(0,180);

}
