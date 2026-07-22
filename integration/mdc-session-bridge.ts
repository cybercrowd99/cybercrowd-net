/* ============================================================
   [NET]
   CyberCrowd NET

   File:
   integration/mdc-session-bridge.ts

   Purpose:
   Defines the NET-side session bridge that attaches governed
   NET session context to MDC visibility requests.

   Owns:
   - NET session reference
   - request/session correlation
   - session timestamps
   - linkage context envelope

   Does NOT own:
   - authentication authority
   - identity creation
   - MDC records
   - permissions
   - consent decisions
   - ledger writes
   - lineage changes

   Boundary:

   NET SESSION
        |
        ▼
   MDC SESSION BRIDGE
        |
        ▼
   MDC LINK CLIENT
        |
        ▼
   MDC SERVICES

   Core Rule:

   NET provides session context.
   MDC governs metadata visibility.

   ============================================================ */



export interface MDCSessionContext {

  session_id:
    string;

  surface:
    string;

  created_at:
    number;

}



export interface MDCSessionRequest {

  request_id:
    string;

  session:
    MDCSessionContext;

  created_at:
    number;

}



export class MDCSessionBridge {


  private sessions =
    new Map<string, MDCSessionContext>();



  register(
    session: MDCSessionContext
  ): MDCSessionContext {


    const frozen =
      Object.freeze({

        session_id:
          cleanId(
            session.session_id
          ),

        surface:
          cleanId(
            session.surface
          ),

        created_at:
          session.created_at || Date.now()

      });


    this.sessions.set(
      frozen.session_id,
      frozen
    );


    return frozen;

  }



  attach(
    session_id: string,
    request_id: string
  ): MDCSessionRequest | null {


    const session =
      this.sessions.get(
        cleanId(session_id)
      );


    if (!session) {

      return null;

    }


    return Object.freeze({

      request_id:
        cleanId(
          request_id
        ),

      session,

      created_at:
        Date.now()

    });

  }



  get(
    session_id: string
  ): MDCSessionContext | null {


    return (
      this.sessions.get(
        cleanId(session_id)
      ) ?? null
    );

  }



  list():
    readonly MDCSessionContext[] {


    return Object.freeze(
      Array.from(
        this.sessions.values()
      )
    );

  }


}



export const CyberCrowdMDCSessionBridge =
  new MDCSessionBridge();




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
