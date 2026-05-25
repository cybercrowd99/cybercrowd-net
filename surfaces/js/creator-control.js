/**
 * Creator Control Surface Module
 * Handles creator tier load, tool listing, draft listing, and creator actions.
 */

import { initSurface } from "./surface.js";

export function initCreatorControl() {
    loadCreatorTier();
    loadCreatorTools();
    loadDrafts();
    wireActions();
}

/**
 * Load creator tier from backend.
 */
function loadCreatorTier() {
    fetch("/api/session")
        .then(r => r.json())
        .then(data => {
            const tierEl = document.getElementById("creator-tier");
            if (tierEl) tierEl.innerText = data.tier || "Unknown";
        })
        .catch(() => {
            const tierEl = document.getElementById("creator-tier");
            if (tierEl) tierEl.innerText = "Unavailable";
        });
}

/**
 * Load creator tools from backend.
 */
function loadCreatorTools() {
    fetch("/api/creator/tools")
        .then(r => r.json())
        .then(data => {
            const list = document.getElementById("creator-tools");
            if (!list) return;

            list.innerHTML = "";
            data.tools.forEach(tool => {
                const li = document.createElement("li");
                li.innerText = tool;
                list.appendChild(li);
            });
        })
        .catch(() => {
            const list = document.getElementById("creator-tools");
            if (list) list.innerHTML = "<li>Unavailable</li>";
        });
}

/**
 * Load creator drafts from backend.
 */
function loadDrafts() {
    fetch("/api/creator/drafts")
        .then(r => r.json())
        .then(data => {
            const list = document.getElementById("creator-drafts");
            if (!list) return;

            list.innerHTML = "";
            data.drafts.forEach(draft => {
                const li = document.createElement("li");
                li.innerText = draft.title;
                list.appendChild(li);
            });
        })
        .catch(() => {
            const list = document.getElementById("creator-drafts");
            if (list) list.innerHTML = "<li>Unavailable</li>";
        });
}

/**
 * Wire up creator actions.
 */
function wireActions() {
    const newDraftBtn = document.getElementById("new-draft");
    const syncToolsBtn = document.getElementById("sync-tools");

    if (newDraftBtn) {
        newDraftBtn.addEventListener("click", () => {
            window.location.href = "/surfaces/draft-editor.html";
        });
    }

    if (syncToolsBtn) {
        syncToolsBtn.addEventListener("click", () => {
            fetch("/api/creator/sync", { method: "POST" })
                .then(() => alert("Tools synced"))
                .catch(() => alert("Sync failed"));
        });
    }
}

// Auto-init
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        initSurface();
        initCreatorControl();
    });
} else {
    initSurface();
    initCreatorControl();
}
