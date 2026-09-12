// CYBERCROWD
//
// REPO:
// cybercrowd99/cybercrowd-net
//
// FILE:
// config.js
//
// LOCATION:
// cybercrowd-turnstile/organ-1-core/
//
// ORGAN:
// ORGAN 1 — CORE
//
// JOB:
// Define fixed CyberCrowd Turnstile
// storage keys, timers, and stage names.
//
// OWNS:
// Configuration constants only.
//
// DOES NOT OWN:
// Storage operations.
// Events.
// State movement.
// Views.
// Routing.
// Authentication.
// Password verification.
// UI.
// Styling.

export const CONFIG = {
  STORAGE_KEYS: {
    RECALL_ID: "cc_total_recall_id",
    VAULT: "cc_identity_vault"
  },
  TIMERS: {
    SCAN_DURATION: 750,
    LOCKOUT_DELAY: 1200
  },
  STAGES: {
    SCAN: "STAGE_SCAN",
    IDENTITY_GATE: "STAGE_IDENTITY_GATE",
    CREATE_ID: "STAGE_CREATE_ID",
    RECALL_ID: "STAGE_RECALL_ID",
    PASSWORD_GATE: "STAGE_PASSWORD_GATE",
    ACCESS_GRANTED: "STAGE_ACCESS_GRANTED"
  }
};
