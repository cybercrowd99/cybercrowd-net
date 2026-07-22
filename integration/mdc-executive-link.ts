/* ============================================================
   [NET]
   CyberCrowd NET

   File:
   integration/mdc-executive-link.ts

   Purpose:
   Defines the NET-side executive visibility bridge that maps
   approved MDC response envelopes into an executive dashboard
   view model.

   Owns:
   - executive view shaping
   - dashboard-safe response mapping
   - visibility aggregation
   - operator display preparation

   Does NOT own:
   - MDC requests
   - MDC storage
   - metadata mutation
   - proof generation
   - ledger writes
   - permissions
   - identity authority

   Boundary:

   MDC RESPONSE ENVELOPE
          |
          ▼
   MDC RESPONSE HANDLER
          |
          ▼
   EXECUTIVE LINK
          |
          ▼
   MDC DASHBOARD

   Core Rule:

   NET prepares visibility.
   NET does not become MDC.

   ============================================================ */



export interface MDCExecutiveView {


  governedState:
    string;


  heartbeat:
    string;


  visibility:
    string;


  capabilities:
    readonly string[];


  chain:
    {

      depth:
        number | string;

      state:
        string;

      percent:
        number;

    };


  ledgerTimeline:
    readonly {

      reference:
        string;

      timestamp:
        number;

    }[];



  session:
    {

      id:
        string;

      createdAt:
        number;

      requestIds:
        readonly string[];

      state:
        string;

    };



  audit:
    {

      timestamp:
        number;

      drift:
        string;

      state:
        string;

    };


}





export interface MDCExecutiveInput {


  status?:
    string;


  heartbeat?:
    string;


  visibility?:
    string;


  capabilities?:
    readonly string[];


  evidence?:
    {

      depth?:
        number;

      state?:
        string;

      percent?:
        number;

    };


  ledger?:
    readonly {

      reference?:
        string;

      timestamp?:
        number;

    }[];



  session?:
    {

      id?:
        string;

      createdAt?:
        number;

      requestIds?:
        readonly string[];

      state?:
        string;

    };



  audit?:
    {

      timestamp?:
        number;

      drift?:
        string;

      state?:
        string;

    };


}





export class MDCExecutiveLink {



  build(
    input:
      MDCExecutiveInput
  ): MDCExecutiveView {


    return Object.freeze({

      governedState:
        clean(
          input.status
        )
        ||
        "UNKNOWN",



      heartbeat:
        clean(
          input.heartbeat
        )
        ||
        "UNKNOWN",



      visibility:
        clean(
          input.visibility
        )
        ||
        "UNKNOWN",



      capabilities:
        Object.freeze(
          input.capabilities
          ??
          []
        ),



      chain:
        Object.freeze({

          depth:
            input.evidence?.depth
            ??
            "--",

          state:
            clean(
              input.evidence?.state
            )
            ||
            "UNKNOWN",

          percent:
            input.evidence?.percent
            ??
            0

        }),



      ledgerTimeline:
        Object.freeze(

          (input.ledger ?? [])
            .map(entry =>
              Object.freeze({

                reference:
                  clean(
                    entry.reference
                  ),

                timestamp:
                  entry.timestamp
                  ??
                  0

              })
            )

        ),




      session:
        Object.freeze({

          id:
            clean(
              input.session?.id
            ),

          createdAt:
            input.session?.createdAt
            ??
            0,

          requestIds:
            Object.freeze(
              input.session?.requestIds
              ??
              []
            ),

          state:
            clean(
              input.session?.state
            )
            ||
            "UNKNOWN"

        }),




      audit:
        Object.freeze({

          timestamp:
            input.audit?.timestamp
            ??
            0,

          drift:
            clean(
              input.audit?.drift
            )
            ||
            "UNKNOWN",

          state:
            clean(
              input.audit?.state
            )
            ||
            "UNKNOWN"

        })

    });


  }



}



export const CyberCrowdMDCExecutiveLink =
  new MDCExecutiveLink();





function clean(
  value:
    unknown
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
