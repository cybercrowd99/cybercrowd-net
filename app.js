// CYBERCROWD
//
// REPO:
// cybercrowd99/cybercrowd-net
//
// FILE:
// app.js
//
// LOCATION:
// cybercrowd-turnstile/organ-4-orchestrator/
//
// ORGAN:
// ORGAN 4 — ORCHESTRATOR
//
// JOB:
// Assemble the CyberCrowd Turnstile
// core, storage, state, event, and
// stage-view systems into one mounted flow.
//
// OWNS:
// Core initialization.
// Overlay activation.
// Main Members Only trigger.
// Stage-change view mounting.
// Navigation event handling.
// Action event coordination.
// Terminal overlay close.
//
// ENTRANCES:
// btn-members-only click.
// STAGE_CHANGED.
// NAV_CREATE_ID.
// NAV_RECALL_ID.
// ACTION_REGISTER.
// ACTION_RECALL_INPUT.
// ACTION_VERIFY_PASS.
// ACTION_TERMINAL_ENTER.
//
// EXITS:
// StateMachine transitions.
// Overlay open/close.
// Terminal alert.
//
// DOES NOT OWN:
// View markup.
// HUD styling.
// Design tokens.
// Storage implementation.
// StateMachine implementation.
// EventBus implementation.
// Authentication authority.
// Server password verification.
// Session.
// Cookie.

import { CONFIG } from "../organ-1-core/config.js";
import { EventBus } from "../organ-1-core/event-bus.js";
import { RecallStorage } from "../organ-1-core/recall-storage.js";
import { StateMachine } from "../organ-1-core/state-machine.js";
import { ViewRouter } from "./view-router.js";

// Initialize Core
const state = new StateMachine();
const overlay = document.getElementById("turnstile-overlay");
const slot = document.getElementById("hud-view-slot");
const router = new ViewRouter(slot);

// 1. Listen for State changes to switch Views
EventBus.on("STAGE_CHANGED", ({ stage, user, error }) => {
  router.mount(stage, { user, error });
});

// 2. Main Trigger: "Members Only"
document.getElementById("btn-members-only").onclick = () => {
  overlay.classList.add("active");
  state.transitionTo(CONFIG.STAGES.SCAN);

  setTimeout(() => {
    const savedId = RecallStorage.getStoredId();
    if (savedId) {
      state.transitionTo(CONFIG.STAGES.PASSWORD_GATE, { userId: savedId });
    } else {
      state.transitionTo(CONFIG.STAGES.IDENTITY_GATE);
    }
  }, CONFIG.TIMERS.SCAN_DURATION);
};

// 3. Navigation Events
EventBus.on("NAV_CREATE_ID", () => state.transitionTo(CONFIG.STAGES.CREATE_ID));
EventBus.on("NAV_RECALL_ID", () => state.transitionTo(CONFIG.STAGES.RECALL_ID));

// 4. Action Handlers (Storage + Verification)
EventBus.on("ACTION_REGISTER", ({ id, pass }) => {
  RecallStorage.saveIdentity(id, pass);
  state.transitionTo(CONFIG.STAGES.PASSWORD_GATE, { userId: id });
});

EventBus.on("ACTION_RECALL_INPUT", ({ id }) => {
  RecallStorage.setStoredId(id);
  state.transitionTo(CONFIG.STAGES.PASSWORD_GATE, { userId: id });
});

EventBus.on("ACTION_VERIFY_PASS", ({ id, secret }) => {
  const isValid = RecallStorage.validateSecret(id, secret);
  if (isValid) {
    state.transitionTo(CONFIG.STAGES.ACCESS_GRANTED);
  } else {
    // Stage 3B failure fallback: Show error, then auto-route to 2A (Create Identity)
    state.transitionTo(CONFIG.STAGES.PASSWORD_GATE, { userId: id, error: true });
    setTimeout(() => {
      state.transitionTo(CONFIG.STAGES.CREATE_ID);
    }, CONFIG.TIMERS.LOCKOUT_DELAY);
  }
});

EventBus.on("ACTION_TERMINAL_ENTER", () => {
  overlay.classList.remove("active");
  alert("CYBERCROWD NODE ACTIVE.");
});
