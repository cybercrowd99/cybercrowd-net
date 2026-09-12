// CYBERCROWD
//
// REPO:
// cybercrowd99/cybercrowd-net
//
// FILE:
// recall-storage.js
//
// LOCATION:
// cybercrowd-turnstile/organ-1-core/
//
// ORGAN:
// ORGAN 1 — CORE
//
// JOB:
// Read and write local CyberCrowd
// recall identity information.
//
// OWNS:
// Recall ID storage.
// Local vault read/write.
// Local secret comparison.
//
// DOES NOT OWN:
// Stage routing.
// Events.
// Views.
// Authentication authority.
// Server password verification.
// Session.
// Cookie.
// UI.
// Styling.

import { CONFIG } from "./config.js";

export const RecallStorage = {
  getStoredId() {
    return localStorage.getItem(CONFIG.STORAGE_KEYS.RECALL_ID);
  },
  setStoredId(id) {
    localStorage.setItem(CONFIG.STORAGE_KEYS.RECALL_ID, id);
  },
  getVault() {
    return JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.VAULT) || "{}");
  },
  saveIdentity(id, secret) {
    const vault = this.getVault();
    vault[id] = secret;
    localStorage.setItem(CONFIG.STORAGE_KEYS.VAULT, JSON.stringify(vault));
    this.setStoredId(id);
  },
  validateSecret(id, secret) {
    const vault = this.getVault();
    return vault[id] === secret;
  }
};
