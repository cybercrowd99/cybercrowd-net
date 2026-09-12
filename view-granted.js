// CYBERCROWD
//
// REPO:
// cybercrowd99/cybercrowd-net
//
// FILE:
// view-granted.js
//
// LOCATION:
// cybercrowd-turnstile/organ-3-stage-views/
//
// ORGAN:
// ORGAN 3 — STAGE VIEWS
//
// JOB:
// Render the isolated CyberCrowd
// access-granted stepping stone.
//
// OWNS:
// Granted view element creation.
// Granted view markup.
// Workspace-entry event emission.
//
// ENTRANCE:
// renderGrantedView()
//
// EXIT:
// ACTION_TERMINAL_ENTER
//
// DOES NOT OWN:
// Access authority.
// Authentication.
// Password verification.
// Identity lookup.
// Stage transitions.
// State.
// Routing.
// Session.
// Cookie.
// Global layout.
// Global styling.

import { EventBus } from "../organ-1-core/event-bus.js";

export function renderGrantedView() {
  const el = document.createElement("div");
  el.className = "hud-view";
  el.innerHTML = `
    <div style="color: var(--cc-cyan); font-weight: bold; margin-bottom: 16px;">
      >>> ACCESS GRANTED: SECURE NODE OPEN
    </div>
    <button class="hud-btn" id="act-enter-portal">Enter Workspace</button>
  `;

  el.querySelector("#act-enter-portal").onclick = () => EventBus.emit("ACTION_TERMINAL_ENTER");
  return el;
}
