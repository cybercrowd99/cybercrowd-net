// CYBERCROWD
//
// REPO:
// cybercrowd99/cybercrowd-net
//
// FILE:
// event-bus.js
//
// LOCATION:
// cybercrowd-turnstile/organ-1-core/
//
// ORGAN:
// ORGAN 1 — CORE
//
// JOB:
// Provide decoupled window-event
// communication between CyberCrowd
// Turnstile components.
//
// OWNS:
// Event emission.
// Event listening.
//
// DOES NOT OWN:
// Component mounting.
// Stage routing.
// State decisions.
// Storage.
// Authentication.
// Password verification.
// UI.
// Styling.
// Direct component-to-component nesting.

// Decoupled window events. No direct component-to-component nesting.
export const EventBus = {
  emit(eventName, detail = {}) {
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
  },
  on(eventName, callback) {
    window.addEventListener(eventName, (e) => callback(e.detail));
  }
};
