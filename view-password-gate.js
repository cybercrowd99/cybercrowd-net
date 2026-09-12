// CYBERCROWD
//
// REPO:
// cybercrowd99/cybercrowd-net
//
// FILE:
// view-password-gate.js
//
// LOCATION:
// cybercrowd-turnstile/organ-3-stage-views/
//
// ORGAN:
// ORGAN 3 — STAGE VIEWS
//
// JOB:
// Render the isolated CyberCrowd
// returning-member password gate
// stepping stone.
//
// OWNS:
// Password gate view element creation.
// Password gate markup.
// Password input collection.
// Password verification event emission.
// Password mismatch message presentation.
//
// ENTRANCE:
// renderPasswordGateView(userId, showError)
//
// EXIT:
// ACTION_VERIFY_PASS
//
// DOES NOT OWN:
// Password verification authority.
// Password storage.
// Identity lookup authority.
// Authentication authority.
// Stage transitions.
// State.
// Routing.
// Session.
// Cookie.
// Global layout.
// Global styling.

import { EventBus } from "../organ-1-core/event-bus.js";

export function renderPasswordGateView(userId, showError = false) {
  const el = document.createElement("div");
  el.className = "hud-view";
  el.innerHTML = `
    <p style="font-size: 0.8rem; color: var(--cc-cyan); margin-bottom: 8px;">TARGET: ${userId}</p>
    <label style="font-size: 0.75rem; color: var(--cc-muted)">SECURITY KEY</label>
    <input class="hud-input" type="password" id="inp-pass" placeholder="••••••••" />
    ${showError ? `<div style="color: var(--cc-red); font-size: 0.8rem; margin-bottom: 10px;">ACCESS DENIED // KEY MISMATCH</div>` : ''}
    <button class="hud-btn" id="act-submit-pass">Verify Key</button>
  `;

  el.querySelector("#act-submit-pass").onclick = () => {
    const secret = el.querySelector("#inp-pass").value;
    EventBus.emit("ACTION_VERIFY_PASS", { id: userId, secret });
  };
  return el;
}
