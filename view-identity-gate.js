// CYBERCROWD
//
// REPO:
// cybercrowd99/cybercrowd-net
//
// FILE:
// view-identity-gate.js
//
// LOCATION:
// cybercrowd-turnstile/organ-3-stage-views/
//
// ORGAN:
// ORGAN 3 — STAGE VIEWS
//
// JOB:
// Render the isolated CyberCrowd
// identity gate stepping stone.
//
// OWNS:
// Identity gate view element creation.
// Identity gate markup.
// Identity gate button event emission.
//
// ENTRANCE:
// renderIdentityGateView()
//
// EXITS:
// NAV_CREATE_ID
// NAV_RECALL_ID
//
// DOES NOT OWN:
// Stage transitions.
// State.
// Routing.
// Storage.
// Authentication.
// Password verification.
// Session.
// Cookie.
// Global layout.
// Global styling.

import { EventBus } from "../organ-1-core/event-bus.js";

export function renderIdentityGateView() {
  const el = document.createElement("div");
  el.className = "hud-view";
  el.innerHTML = `
    <div style="color: var(--cc-red); margin-bottom: 16px; font-size: 0.85rem;">
      [!] NO RECALL IDENTITY FOUND
    </div>
    <button class="hud-btn" id="act-goto-create">2A: Create Identity</button>
    <button class="hud-btn secondary" id="act-goto-recall">2B: Manual Identifier</button>
  `;

  el.querySelector("#act-goto-create").onclick = () => EventBus.emit("NAV_CREATE_ID");
  el.querySelector("#act-goto-recall").onclick = () => EventBus.emit("NAV_RECALL_ID");
  return el;
}
