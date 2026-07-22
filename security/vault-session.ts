/* ============================================================
   [NET]
   CyberCrowd NET

   File:
   security/vault-session.ts

   Purpose:
   Defines the NET-side short-lived vault session envelope
   created after a valid employee vault pass is presented.

   Owns:
   - session reference
   - employee uIDL correlation
   - pass correlation
   - session lifecycle timestamps
   - dashboard/session handoff reference

   Does NOT own:
   - password storage
   - identity creation
   - authentication authority
   - permission decisions
   - MDC access
   - metadata mutation
   - ledger operations

   Boundary:

   EMPLOYEE VAULT PASS
          |
          ▼
   VAULT SESSION
          |
          ▼
   NET EXECUTIVE ENTRY
          |
          ▼
   MDC VISIBILITY REQUEST

   Core Rule:

   Session remembers access context.
   Session does not grant authority.

   ============================================================ */



export type VaultSessionState =

  | "CREATED"
  | "ACTIVE"
  | "EXPIRED"
  | "LOCKED";





export interface VaultSessionInput {


  employeeUIDL:
    string;


  passReference:
    string;


  sessionTTL:
    number;


}





export interface VaultSession {


  readonly type:
    "vault-session";


  readonly version:
    "VS-1";


  readonly sessionId:
    string;


  readonly employeeUIDL:
    string;


  readonly passReference:
    string;


  readonly createdAt:
    number;


  readonly expiresAt:
    number;


  readonly state:
    VaultSessionState;


}





export class VaultSessionService {



  create(
    input:
      VaultSessionInput
  ): VaultSession {



    const createdAt =
      Date.now();



    return Object.freeze({

      type:
        "vault-session",


      version:
        "VS-1",


      sessionId:
        createReference(
          "session"
        ),


      employeeUIDL:
        cleanId(
          input.employeeUIDL
        ),


      passReference:
        cleanId(
          input.passReference
        ),


      createdAt,


      expiresAt:
        createdAt
        +
        input.sessionTTL,


      state:
        "CREATED"

    });


  }





  activate(
    session:
      VaultSession
  ): VaultSession {


    return Object.freeze({

      ...session,

      state:
        "ACTIVE"

    });


  }





  expire(
    session:
      VaultSession
  ): VaultSession {


    return Object.freeze({

      ...session,

      state:
        "EXPIRED"

    });


  }





  isActive(
    session:
      VaultSession
  ): boolean {


    return (

      session.state ===
        "ACTIVE"

      &&

      Date.now()
        <
      session.expiresAt

    );


  }



}




export const CyberCrowdVaultSession =
  new VaultSessionService();







function createReference(
  prefix:
    string
): string {


  return (

    prefix
    +
    "-"
    +
    Date.now()
    +
    "-"
    +
    cryptoRandom()

  );


}





function cryptoRandom(): string {


  return Math
    .random()
    .toString(36)
    .slice(2,12);


}





function cleanId(
  value:
    unknown
): string {


  if (

    typeof value !== "string"

    &&

    typeof value !== "number"

  ) {

    return "";

  }


  return String(value)
    .trim()
    .slice(0,128);

}
