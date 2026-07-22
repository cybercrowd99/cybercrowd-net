/* ============================================================
   [NET]
   CyberCrowd NET

   File:
   security/device-attestation.ts

   Purpose:
   Defines the NET-side device attestation envelope used
   to associate an employee vault pass with a known device
   reference without storing secrets or becoming an authority.

   Owns:
   - device reference
   - pass correlation reference
   - attestation timestamp
   - device session context

   Does NOT own:
   - device surveillance
   - password storage
   - authentication authority
   - permission decisions
   - identity creation
   - MDC access
   - metadata mutation
   - ledger operations

   Boundary:

   EMPLOYEE VAULT PASS
          |
          ▼
   DEVICE ATTESTATION
          |
          ▼
   VAULT SESSION CONTEXT
          |
          ▼
   EXECUTIVE ACCESS SURFACE

   Core Rule:

   Device attestation identifies the instrument.
   It does not grant authority.

   ============================================================ */



export interface DeviceAttestationInput {


  deviceReference:
    string;


  passReference:
    string;


  employeeUIDL:
    string;


}





export interface DeviceAttestation {


  readonly type:
    "device-attestation";


  readonly version:
    "DA-1";


  readonly attestationId:
    string;


  readonly deviceReference:
    string;


  readonly passReference:
    string;


  readonly employeeUIDL:
    string;


  readonly createdAt:
    number;


  readonly state:
    "ATTESTED"
    |
    "REVOKED";


}





export class DeviceAttestationService {



  create(
    input:
      DeviceAttestationInput
  ): DeviceAttestation {


    return Object.freeze({


      type:
        "device-attestation",


      version:
        "DA-1",


      attestationId:
        createReference(
          "device"
        ),


      deviceReference:
        cleanId(
          input.deviceReference
        ),


      passReference:
        cleanId(
          input.passReference
        ),


      employeeUIDL:
        cleanId(
          input.employeeUIDL
        ),


      createdAt:
        Date.now(),


      state:
        "ATTESTED"


    });


  }





  revoke(
    attestation:
      DeviceAttestation
  ): DeviceAttestation {


    return Object.freeze({


      ...attestation,


      state:
        "REVOKED"


    });


  }





  isValid(
    attestation:
      DeviceAttestation
  ): boolean {


    return (

      attestation.type ===
        "device-attestation"

      &&

      attestation.version ===
        "DA-1"

      &&

      attestation.state ===
        "ATTESTED"

      &&

      Boolean(
        attestation.deviceReference
      )

    );


  }



}





export const CyberCrowdDeviceAttestation =
  new DeviceAttestationService();







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
    randomPart()

  );


}





function randomPart(): string {


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
