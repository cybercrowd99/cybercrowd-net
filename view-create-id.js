// CYBERCROWD
//
// REPO:
// cybercrowd99/cybercrowd-net
//
// FILE:
// view-create-id.js
//
// LOCATION:
// cybercrowd-turnstile/organ-3-stage-views/
//
// ORGAN:
// ORGAN 3 — STAGE VIEWS
//
// JOB:
// Render the isolated CyberCrowd
// create-identity stepping stone.
//
// OWNS:
// Create identity view element creation.
// Create identity markup.
// Create identity input collection.
// Registration event emission.
//
// ENTRANCE:
// renderCreateIdView()
//
// EXIT:
// ACTION_REGISTER
//
// DOES NOT OWN:
// Identity persistence.
// Password storage.
// Password verification.
// Authentication authority.
// Stage transitions.
// State.
// Routing.
// Session.
// Cookie.
// Global layout.
// Global styling.

import { EventBus } from "../organ-1-core/event-bus.js";

export function renderCreateIdView() {
  const el = document.createElement("div");
  el.className = "hud-view";
  el.innerHTML = `
    <label style="font-size: 0.75rem; color: var(--cc-muted)">ASSIGN IDENTITY HANDLE</label>
    <input class="hud-input" type="text" id="inp-new-id" placeholder="user@cybercrowd.net" />
    <label style="font-size: 0.75rem; color: var(--cc-muted)">CREATE ACCESS KEY</label>
    <input class="hud-input" type="password" id="inp-new-pass" placeholder="••••••••" />
    <button class="hud-btn" id="act-submit-create">Register Identity</button>
  `;

  el.querySelector("#act-submit-create").onclick = () => {
    const id = el.querySelector("#inp-new-id").value.trim();
    const pass = el.querySelector("#inp-new-pass").value;
    if (id && pass) EventBus.emit("ACTION_REGISTER", { id, pass });
  };
  return el;
}
