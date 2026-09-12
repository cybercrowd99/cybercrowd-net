// CYBERCROWD
//
// REPO:
// cybercrowd99/cybercrowd-net
//
// FILE:
// view-recall-id.js
//
// LOCATION:
// cybercrowd-turnstile/organ-3-stage-views/
//
// ORGAN:
// ORGAN 3 — STAGE VIEWS
//
// JOB:
// Render the isolated CyberCrowd
// recall-identity stepping stone.
//
// OWNS:
// Recall identity view element creation.
// Recall identity markup.
// Recall handle input collection.
// Recall input event emission.
//
// ENTRANCE:
// renderRecallIdView()
//
// EXIT:
// ACTION_RECALL_INPUT
//
// DOES NOT OWN:
// Identity lookup authority.
// Identity persistence.
// Password collection.
// Password verification.
// Authentication.
// Stage transitions.
// State.
// Routing.
// Session.
// Cookie.
// Global layout.
// Global styling.

import { EventBus } from "../organ-1-core/event-bus.js";

export function renderRecallIdView() {
  const el = document.createElement("div");
  el.className = "hud-view";
  el.innerHTML = `
    <label style="font-size: 0.75rem; color: var(--cc-muted)">ENTER TOTAL RECALL HANDLE</label>
    <input class="hud-input" type="text" id="inp-recall-id" placeholder="user@domain.com" />
    <button class="hud-btn" id="act-submit-recall">Validate ID</button>
  `;

  el.querySelector("#act-submit-recall").onclick = () => {
    const id = el.querySelector("#inp-recall-id").value.trim();
    if (id) EventBus.emit("ACTION_RECALL_INPUT", { id });
  };
  return el;
}
