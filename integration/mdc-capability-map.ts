/* ============================================================
   [NET]
   CyberCrowd NET

   File:
   integration/mdc-capability-map.ts

   Purpose:
   Defines the NET-side capability awareness layer for known
   MDC visibility capabilities.

   Owns:
   - MDC capability references
   - capability labels
   - available read-path declarations
   - NET routing awareness

   Does NOT own:
   - enabling services
   - disabling services
   - MDC authority
   - permission decisions
   - metadata records
   - proof generation
   - ledger changes

   Boundary:

   NET CAPABILITY VIEW
          |
          ▼
   MDC CAPABILITY MAP
          |
          ▼
   MDC SERVICE CONTRACT
          |
          ▼
   MDC SERVICES

   Core Rule:

   NET knows what doors exist.
   NET does not hold the keys.

   ============================================================ */



export type MDCCapability =
  | "query"
  | "proof"
  | "audit"
  | "lineage"
  | "ledger";



export interface MDCCapabilityEntry {

  capability:
    MDCCapability;

  service_reference:
    string;

  description:
    string;

  available:
    boolean;

}



export class MDCCapabilityMap {


  private capabilities:
    Map<string, MDCCapabilityEntry>;



  constructor() {

    this.capabilities =
      new Map();

    this.registerDefaults();

  }



  private registerDefaults() {


    this.add({

      capability:
        "query",

      service_reference:
        "mdc-query-service",

      description:
        "Read-only structural metadata visibility",

      available:
        true

    });



    this.add({

      capability:
        "proof",

      service_reference:
        "mdc-proof-service",

      description:
        "Read-only verification artifact visibility",

      available:
        true

    });



    this.add({

      capability:
        "audit",

      service_reference:
        "mdc-audit-service",

      description:
        "Read-only audit observation visibility",

      available:
        true

    });



    this.add({

      capability:
        "lineage",

      service_reference:
        "mdc-lineage-service",

      description:
        "Read-only origin path visibility",

      available:
        true

    });



    this.add({

      capability:
        "ledger",

      service_reference:
        "mdc-ledger-service",

      description:
        "Read-only ledger history visibility",

      available:
        true

    });


  }



  add(
    capability:
      MDCCapabilityEntry
  ): MDCCapabilityEntry {


    const entry =
      Object.freeze({

        capability:
          capability.capability,

        service_reference:
          cleanId(
            capability.service_reference
          ),

        description:
          cleanId(
            capability.description
          ),

        available:
          Boolean(
            capability.available
          )

      });


    this.capabilities.set(
      entry.capability,
      entry
    );


    return entry;

  }



  get(
    capability:
      MDCCapability
  ): MDCCapabilityEntry | null {


    return (
      this.capabilities.get(
        capability
      ) ?? null
    );

  }



  list():
    readonly MDCCapabilityEntry[] {


    return Object.freeze(

      Array.from(
        this.capabilities.values()
      )

    );

  }


}



export const CyberCrowdMDCCapabilityMap =
  new MDCCapabilityMap();




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
