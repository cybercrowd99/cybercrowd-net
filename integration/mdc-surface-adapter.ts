/* ============================================================
   [NET]
   CyberCrowd NET

   File:
   integration/mdc-surface-adapter.ts

   Purpose:
   Connects CyberCrowd NET surfaces to the MDC request path.

   Owns:
   - surface identity
   - lane identification
   - surface request mapping
   - NET-side MDC request creation

   Does NOT own:
   - metadata storage
   - MDC authority
   - consent decisions
   - proof generation
   - ledger history
   - lineage changes

   Boundary:

   NET SURFACE
        |
        ▼
   MDC SURFACE ADAPTER
        |
        ▼
   MDC REQUEST ROUTER
        |
        ▼
   MDC LINK CLIENT

   Core Rule:

   The adapter knows where a request came from.
   It does not decide what MDC allows.

   ============================================================ */


import {
  CyberCrowdMDCRequestRouter,
  MDCNetRouteResult
} from "./mdc-request-router";



export type CyberCrowdSurface =
  | "public"
  | "private"
  | "social"
  | "shop"
  | "needs"
  | "ican";



export interface MDCSurfaceRequest {

  surface:
    CyberCrowdSurface;

  reference:
    string;

}



export class MDCSurfaceAdapter {


  adapt(
    input: MDCSurfaceRequest
  ): MDCNetRouteResult {


    const target =
      this.resolveTarget(
        input.surface
      );


    return CyberCrowdMDCRequestRouter.route({

      source:
        input.surface,

      target,

      reference:
        input.reference

    });

  }



  private resolveTarget(
    surface: CyberCrowdSurface
  ) {


    switch(surface) {


      case "private":
        return "proof";


      case "shop":
        return "ledger";


      case "social":
        return "audit";


      case "ican":
        return "lineage";


      case "needs":
        return "query";


      case "public":
      default:
        return "query";

    }

  }


}



export const CyberCrowdMDCSurfaceAdapter =
  new MDCSurfaceAdapter();
