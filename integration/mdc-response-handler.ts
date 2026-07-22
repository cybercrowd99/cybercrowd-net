/* ============================================================
   [NET]
   CyberCrowd NET

   File:
   integration/mdc-response-handler.ts

   Purpose:
   Defines the NET-side response handling layer for receiving
   governed MDC responses and returning them to NET surfaces.

   Owns:
   - MDC response envelopes
   - response normalization
   - surface delivery references
   - response timestamps

   Does NOT own:
   - metadata interpretation
   - proof creation
   - ledger modification
   - lineage changes
   - permission decisions
   - MDC authority

   Boundary:

   MDC SERVICE RESPONSE
          |
          ▼
   NET RESPONSE HANDLER
          |
          ▼
   NET SURFACE VIEW

   Core Rule:

   NET displays governed responses.
   NET does not redefine MDC truth.

   ============================================================ */


import {
  MDCAccessTarget
} from "./mdc-link-client";



export type MDCResponseStatus =
  | "fulfilled"
  | "unavailable"
  | "rejected";



export interface MDCResponseEnvelope {

  id: string;

  request_id: string;

  target:
    MDCAccessTarget;

  status:
    MDCResponseStatus;

  response_reference:
    string;

  received_at:
    number;

}



export interface NETSurfaceResponse {

  surface:
    string;

  target:
    MDCAccessTarget;

  status:
    MDCResponseStatus;

  reference:
    string;

  delivered_at:
    number;

}



export class MDCResponseHandler {


  handle(
    surface: string,
    response: MDCResponseEnvelope
  ): NETSurfaceResponse {


    return Object.freeze({

      surface:
        cleanId(surface),

      target:
        response.target,

      status:
        response.status,

      reference:
        cleanId(
          response.response_reference
        ),

      delivered_at:
        Date.now()

    });

  }



  isAvailable(
    response: MDCResponseEnvelope
  ): boolean {


    return (
      response.status === "fulfilled"
    );

  }


}



export const CyberCrowdMDCResponseHandler =
  new MDCResponseHandler();




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
