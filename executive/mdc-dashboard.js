/* ============================================================
   [NET]
   CyberCrowd NET

   File:
   executive/mdc-dashboard.js

   Purpose:
   Executive dashboard behavior layer for governed
   NET → MDC visibility.

   Owns:
   - dashboard rendering
   - response display
   - capability display
   - session visibility display
   - operator indicators

   Does NOT own:
   - MDC decisions
   - metadata mutation
   - proof generation
   - ledger writes
   - authentication
   - permissions

   Boundary:

   MDC RESPONSE
          |
          ▼
   NET RESPONSE HANDLER
          |
          ▼
   DASHBOARD VIEW

   Core Rule:

   NET displays MDC visibility.
   NET does not control MDC.

   ============================================================ */



const dashboardState = {

  governed:
    "Checking...",

  heartbeat:
    "Checking...",

  visibility:
    "Checking...",

  timestamp:
    Date.now()

};





function setText(
  id,
  value
) {

  const element =
    document.getElementById(id);


  if (!element) {

    return;

  }


  element.textContent =
    value ?? "--";

}





function updateTimestamp() {


  setText(
    "dashboard-timestamp",
    new Date().toISOString()
  );


}





function updateGovernedState(
  state
) {


  dashboardState.governed =
    state;


  setText(
    "governed-state",
    state
  );


}





function updateHeartbeat(
  state
) {


  dashboardState.heartbeat =
    state;


  setText(
    "mdc-heartbeat",
    state
  );


}





function updateVisibility(
  state
) {


  dashboardState.visibility =
    state;


  setText(
    "mdc-visibility-mode",
    state
  );


}





function updateChain(
  depth,
  state,
  percent
) {


  setText(
    "chain-depth",
    depth
  );


  setText(
    "chain-state",
    state
  );


  const fill =
    document.getElementById(
      "chain-bar-fill"
    );


  if (fill) {

    fill.style.width =
      `${percent}%`;

  }


}





function updateLedgerTimeline(
  records = []
) {


  const rail =
    document.getElementById(
      "ledger-timeline"
    );


  if (!rail) {

    return;

  }


  rail.innerHTML = "";


  records.forEach(
    record => {


      const marker =
        document.createElement(
          "div"
        );


      marker.className =
        "timeline-marker";


      marker.title =
        `${record.reference ?? ""} ${record.timestamp ?? ""}`;


      rail.appendChild(
        marker
      );


    }

  );


}





function updateCapabilities(
  capabilities = []
) {


  const rail =
    document.getElementById(
      "capability-rail"
    );


  if (!rail) {

    return;

  }


  rail.innerHTML =
    "";


  capabilities.forEach(
    capability => {


      const item =
        document.createElement(
          "div"
        );


      item.className =
        "capability-item";


      item.textContent =
        capability;


      rail.appendChild(
        item
      );


    }

  );


}





function updateSession(
  session = {}
) {


  setText(
    "active-session",
    session.id
  );


  setText(
    "request-ids",
    session.requestIds?.join(", ")
      ?? "--"
  );


  setText(
    "link-state",
    session.state
      ?? "UNKNOWN"
  );


  if (session.createdAt) {


    const age =
      Date.now()
      -
      session.createdAt;


    setText(
      "session-age",
      formatAge(age)
    );


  }


}





function updateAudit(
  audit = {}
) {


  setText(
    "audit-timestamp",
    audit.timestamp
  );


  setText(
    "audit-drift",
    audit.drift
  );


  setText(
    "audit-state",
    audit.state
  );


}





function formatAge(
  milliseconds
) {


  const seconds =
    Math.floor(
      milliseconds / 1000
    );


  const minutes =
    Math.floor(
      seconds / 60
    );


  const hours =
    Math.floor(
      minutes / 60
    );


  return `${hours}h ${minutes % 60}m ${seconds % 60}s`;

}





/*
------------------------------------------------------------

Governed update entry point.

This expects already-approved NET response data.

It does not query MDC directly.

------------------------------------------------------------
*/


export function renderMDCDashboard(
  data = {}
) {


  updateGovernedState(
    data.governedState
      ?? "UNKNOWN"
  );


  updateHeartbeat(
    data.heartbeat
      ?? "UNKNOWN"
  );


  updateVisibility(
    data.visibility
      ?? "UNKNOWN"
  );


  updateChain(
    data.chain?.depth
      ?? "--",

    data.chain?.state
      ?? "--",

    data.chain?.percent
      ?? 0
  );


  updateLedgerTimeline(
    data.ledgerTimeline
      ?? []
  );


  updateCapabilities(
    data.capabilities
      ?? []
  );


  updateSession(
    data.session
      ?? {}
  );


  updateAudit(
    data.audit
      ?? {}
  );


  updateTimestamp();

}





/*
Initial executive observation state.

Real MDC response binding occurs through
existing NET integration layers.

*/

renderMDCDashboard({

  governedState:
    "READY",

  heartbeat:
    "WAITING",

  visibility:
    "WAITING",

  capabilities:
    [
      "QUERY",
      "PROOF",
      "AUDIT",
      "LINEAGE",
      "LEDGER"
    ]

});
