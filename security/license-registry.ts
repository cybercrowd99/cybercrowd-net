/* ============================================================
   [NET]
   CyberCrowd NET

   File:
   security/license-registry.ts

   Purpose:
   Defines the NET-side registry for issued CyberCrowd
   operator license instruments.

   Owns:
   - license reference inventory
   - issuance records
   - lifecycle state
   - device/pass correlation references

   Does NOT own:
   - authentication
   - permission decisions
   - MDC access
   - identity creation
   - password storage
   - metadata mutation
   - ledger operations

   Boundary:

   LICENSE INVENTORY
          |
          ▼
   VAULT PASS
          |
          ▼
   DEVICE ATTESTATION
          |
          ▼
   VAULT SESSION

   Core Rule:

   The registry remembers instruments.
   The registry does not authorize operators.

   ============================================================ */



export type LicenseState =
  | "ISSUED"
  | "ACTIVE"
  | "SUSPENDED"
  | "RETIRED";



export interface LicenseRecordInput {

  licenseReference:
    string;

  employeeUIDL:
    string;

  passReference:
    string;

  deviceReference:
    string;

}



export interface LicenseRecord {


  readonly type:
    "license-record";


  readonly version:
    "LR-1";


  readonly licenseReference:
    string;


  readonly employeeUIDL:
    string;


  readonly passReference:
    string;


  readonly deviceReference:
    string;


  readonly createdAt:
    number;


  readonly state:
    LicenseState;


}





export class LicenseRegistry {



  private records:
    Map<string, LicenseRecord> =
      new Map();



  register(
    input:
      LicenseRecordInput
  ): LicenseRecord {


    const record =
      Object.freeze({

        type:
          "license-record",

        version:
          "LR-1",

        licenseReference:
          cleanId(input.licenseReference),

        employeeUIDL:
          cleanId(input.employeeUIDL),

        passReference:
          cleanId(input.passReference),

        deviceReference:
          cleanId(input.deviceReference),

        createdAt:
          Date.now(),

        state:
          "ISSUED"

      });



    this.records.set(
      record.licenseReference,
      record
    );


    return record;


  }





  get(
    licenseReference:
      string
  ): LicenseRecord | undefined {


    return this.records.get(
      cleanId(licenseReference)
    );


  }





  list(): readonly LicenseRecord[] {


    return Object.freeze(

      Array.from(
        this.records.values()
      )

    );


  }





  updateState(
    licenseReference:
      string,

    state:
      LicenseState

  ): LicenseRecord | undefined {


    const existing =
      this.get(
        licenseReference
      );


    if (!existing) {

      return undefined;

    }


    const updated =
      Object.freeze({

        ...existing,

        state

      });



    this.records.set(
      existing.licenseReference,
      updated
    );


    return updated;


  }



}



export const CyberCrowdLicenseRegistry =
  new LicenseRegistry();





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
