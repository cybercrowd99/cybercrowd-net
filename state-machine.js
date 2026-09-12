// CYBERCROWD
//
// REPO:
// cybercrowd99/cybercrowd-net
//
// FILE:
// state-machine.js
//
// LOCATION:
// cybercrowd-turnstile/organ-1-core/
//
// ORGAN:
// ORGAN 1 — CORE
//
// JOB:
// Hold the current Turnstile stage,
// retain the active user reference,
// and announce completed stage changes.
//
// OWNS:
// Current stage state.
// Active user reference.
// Stage transition announcement.
//
// ENTRANCE:
// transitionTo(stage, payload)
//
// EXIT:
// STAGE_CHANGED
//
// DOES NOT OWN:
// View rendering.
// View mounting.
// Storage persistence.
// Authentication.
// Password verification.
// Session.
// Cookie.
// Styling.
// Direct component-to-component nesting.

import { CONFIG } from "./config.js";
import { EventBus } from "./event-bus.js";

export class StateMachine {
  constructor() {
    this.currentStage = null;
    this.activeUser = null;
  }

  transitionTo(stage, payload = {}) {
    this.currentStage = stage;
    if (payload.userId) this.activeUser = payload.userId;
    EventBus.emit("STAGE_CHANGED", { stage, user: this.activeUser, ...payload });
  }
}
