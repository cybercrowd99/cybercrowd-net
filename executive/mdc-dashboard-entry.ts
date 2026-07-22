/* ============================================================
   [NET]
   CyberCrowd NET

   File:
   executive/mdc-dashboard-entry.ts

   Purpose:
   Boot boundary for the MDC Executive Dashboard.
   Initializes the executive surface using NET-approved
   visibility models.

   Owns:
   - dashboard startup lifecycle
   - executive view initialization
   - NET view model injection
   - vault session handoff reference

   Does NOT own:
   - MDC requests
   - MDC authority
   - credential creation
   - password storage
   - metadata mutation
   - ledger access

   Rule:

   NET opens the window.
   MDC remains the vault.

   ============================================================ */


import {
  renderMDCDashboard
} from "./mdc-dashboard.js";


import {
  CyberCrowdMDCExecutiveLink
} from "../integration/mdc-executive-link.js";



export interface ExecutiveVaultSession {

  employeeUIDL:
    string;

  sessionReference:
    string;

  vaultState:
    "READY" |
    "LOCKED" |
    "EXPIRED";

}




export class MDCDashboardEntry {


  start(
    payload:
      unknown,
    vaultSession:
      ExecutiveVaultSession
  ) {


    if (
      vaultSession.vaultState !== "READY"
    ) {

      renderMDCDashboard({

        governedState:
          "LOCKED",

        heartbeat:
          "STOPPED",

        visibility:
          "UNAVAILABLE"

      });

      return;

    }



    const executiveView =
      CyberCrowdMDCExecutiveLink.build(
        payload as any
      );



    renderMDCDashboard(
      executiveView
    );

  }


}



export const CyberCrowdMDCDashboardEntry =
  new MDCDashboardEntry();
