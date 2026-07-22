/* ============================================================
   [NET]
   CyberCrowd NET

   File:
   integration/mdc-link-client.ts

   Purpose:
   Defines the NET-side client boundary for requesting
   governed visibility from CyberCrowd Metadata Center.

   Owns:
   - NET request envelopes
   - MDC endpoint references
   - response handling shape
   - linkage timestamps

   Does NOT own:
   - MDC records
   - metadata storage
   - proof creation
   - ledger writing
   - lineage creation
   - permission authority

   Boundary:

   NET SURFACE
        |
        ▼
   MDC LINK CLIENT
        |
        ▼
   MDC SERVICE CONTRACT
        |
        ▼
   MDC SERVICES

   Core Rule:

   NET requests.
   MDC responds.
   NET does not become MDC.

   ============================================================ */


export type MDCAccessTarget =
  | "query"
  | "proof"
  | "audit"
  | "lineage"
  | "ledger";


export interface MDCLinkRequest {

  id: string;

  target: MDCAccessTarget;

  reference: string;

  created_at: number;

}



export interface MDCLinkResponse {

  id: string;

  request_id: string;

  target: MDCAccessTarget;

  status:
    | "requested"
    | "fulfilled"
    | "unavailable";

  response_reference: string;

  created_at: number;

}



export class MDCLinkClient {


  request(
    target: MDCAccessTarget,
    reference: string
  ): MDCLinkRequest {


    return Object.freeze({

      id:
        createId(
          "net-mdc-request"
        ),

      target,

      reference:
        cleanId(reference),

      created_at:
        Date.now()

    });

  }



  receive(
    request: MDCLinkRequest,
    response_reference: string,
    available = true
  ): MDCLinkResponse {


    return Object.freeze({

      id:
        createId(
          "net-mdc-response"
        ),

      request_id:
        request.id,

      target:
        request.target,

      status:
        available
          ? "fulfilled"
          : "unavailable",

      response_reference:
        cleanId(response_reference),

      created_at:
        Date.now()

    });

  }

}



export const CyberCrowdMDCLinkClient =
  new MDCLinkClient();



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



function createId(
  prefix: string
): string {

  return (
    prefix +
    "-" +
    Date.now()
      .toString(36) +
    "-" +
    Math.random()
      .toString(36)
      .slice(2)
  );

}
