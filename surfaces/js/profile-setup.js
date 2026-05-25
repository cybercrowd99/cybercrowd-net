/**
 * Profile Setup Surface Module
 * Handles identity load, avatar load, and heartbeat/session sync.
 */

import { initSurface } from "./surface.js";

export function initProfileSetup() {
    loadIdentity();
    loadTier();
    loadHeartbeat();
}

/**
 * Load stored identity from localStorage.
 */
function loadIdentity() {
    const name = localStorage.getItem("cc_profile_name") || "Unknown User";
    const avatar = localStorage.getItem("cc_profile_avatar") || "/assets/default-avatar.png";

    const nameEl = document.getElementById("profile-name");
    const avatarEl = document.getElementById("profile-avatar");

    if (nameEl) nameEl.innerText = name;
    if (avatarEl) avatarEl.src = avatar;
}

/**
 * Load session tier from backend.
 */
function loadTier() {
    fetch("/api/session")
        .then(r => r.json())
        .then(data => {
            const tierEl = document.getElementById("profile-tier");
            if (tierEl) tierEl.innerText = data.tier || "Unknown";
        })
        .catch(() => {
            const tierEl = document.getElementById("profile-tier");
            if (tierEl) tierEl.innerText = "Unavailable";
        });
}

/**
 * Load heartbeat status from backend.
 */
function loadHeartbeat() {
    fetch("/api/heartbeat")
        .then(r => r.json())
        .then(data => {
            const hbEl = document.getElementById("profile-status");
            if (hbEl) hbEl.innerText = data.status || "ONLINE";
        })
        .catch(() => {
            const hbEl = document.getElementById("profile-status");
            if (hbEl) hbEl.innerText = "OFFLINE";
        });
}

// Auto-init
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        initSurface();
        initProfileSetup();
    });
} else {
    initSurface();
    initProfileSetup();
}
