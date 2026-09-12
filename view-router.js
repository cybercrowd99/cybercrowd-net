// CYBERCROWD
//
// REPO:
// cybercrowd99/cybercrowd-net
//
// FILE:
// view-router.js
//
// LOCATION:
// cybercrowd-turnstile/organ-4-orchestrator/
//
// ORGAN:
// ORGAN 4 — ORCHESTRATOR
//
// JOB:
// Mount exactly one CyberCrowd
// Turnstile stage view into the
// orchestrator container.
//
// OWNS:
// View selection by stage.
// Container purge before mount.
// Mounting one stage view.
//
// ENTRANCE:
// mount(stage, payload)
//
// EXIT:
// One rendered stage view.
//
// DOES NOT OWN:
// Stage decisions.
// State mutation.
// Event authority.
// Storage.
// Identity authority.
// Authentication.
// Password verification.
// Session.
// Cookie.
// View internals.
// Global styling.

import { CONFIG } from "../organ-1-core/config.js";
import { renderScanView } from "../organ-3-stage-views/view-scan.js";
import { renderIdentityGateView } from "../organ-3-stage-views/view-identity-gate.js";
import { renderCreateIdView } from "../organ-3-stage-views/view-create-id.js";
import { renderRecallIdView } from "../organ-3-stage-views/view-recall-id.js";
import { renderPasswordGateView } from "../organ-3-stage-views/view-password-gate.js";
import { renderGrantedView } from "../organ-3-stage-views/view-granted.js";

export class ViewRouter {
  constructor(containerElement) {
    this.container = containerElement;
  }

  mount(stage, payload = {}) {
    this.container.innerHTML = ""; // Complete purge, zero nested DOM leaks

    switch (stage) {
      case CONFIG.STAGES.SCAN:
        this.container.appendChild(renderScanView());
        break;
      case CONFIG.STAGES.IDENTITY_GATE:
        this.container.appendChild(renderIdentityGateView());
        break;
      case CONFIG.STAGES.CREATE_ID:
        this.container.appendChild(renderCreateIdView());
        break;
      case CONFIG.STAGES.RECALL_ID:
        this.container.appendChild(renderRecallIdView());
        break;
      case CONFIG.STAGES.PASSWORD_GATE:
        this.container.appendChild(renderPasswordGateView(payload.user, payload.error));
        break;
      case CONFIG.STAGES.ACCESS_GRANTED:
        this.container.appendChild(renderGrantedView());
        break;
    }
  }
}
