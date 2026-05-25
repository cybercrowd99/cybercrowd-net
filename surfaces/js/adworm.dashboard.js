/**
 * AdWorm Dashboard Surface Module
 * Handles AdWorm status, slot listing, metrics, refresh, sync, and diagnostics.
 */

import { initSurface } from "./surface.js";

export function initAdWormDashboard() {
    loadStatus();
    loadSlots();
    loadMetrics();
    wireActions();
}

/**
 * Load AdWorm engine status.
 */
function loadStatus() {
    fetch("/api/adworm/status")
        .then(r => r.json())
        .then(data => {
            const el = document.getElementById("adworm-status");
            if (el) el.innerText = data.status || "UNKNOWN";
        })
        .catch(() => {
            const el = document.getElementById("adworm-status");
            if (el) el.innerText = "UNAVAILABLE";
        });
}

/**
 * Load active ad slots.
 */
function loadSlots() {
    fetch("/api/adworm/slots")
        .then(r => r.json())
        .then(data => {
            const list = document.getElementById("adworm-slots");
            if (!list) return;

            list.innerHTML = "";
            data.slots.forEach(slot => {
                const li = document.createElement("li");
                li.innerText = slot;
                list.appendChild(li);
            });
        })
        .catch(() => {
            const list = document.getElementById("adworm-slots");
            if (list) list.innerHTML = "<li>Unavailable</li>";
        });
}

/**
 * Load AdWorm metrics.
 */
function loadMetrics() {
    fetch("/api/adworm/metrics")
        .then(r => r.json())
        .then(data => {
            const imp = document.getElementById("adworm-impressions");
            const clk = document.getElementById("adworm-clicks");
            const ctr = document.getElementById("adworm-ctr");

            if (imp) imp.innerText = data.impressions ?? 0;
            if (clk) clk.innerText = data.clicks ?? 0;
            if (ctr) ctr.innerText = (data.ctr ?? 0) + "%";
        })
        .catch(() => {
            const imp = document.getElementById("adworm-impressions");
            const clk = document.getElementById("adworm-clicks");
            const ctr = document.getElementById("adworm-ctr");

            if (imp) imp.innerText = "0";
            if (clk) clk.innerText = "0";
            if (ctr) ctr.innerText = "0%";
        });
}

/**
 * Wire up AdWorm actions.
 */
function wireActions() {
    const refreshBtn = document.getElementById("refresh-adworm");
    const syncBtn = document.getElementById("sync-adworm");
    const diagBtn = document.getElementById("diagnose-adworm");

    if (refreshBtn) {
        refreshBtn.addEventListener("click", () => {
            fetch("/api/adworm/refresh", { method: "POST" })
                .then(() => alert("AdWorm refreshed"))
                .catch(() => alert("Refresh failed"));
        });
    }

    if (syncBtn) {
        syncBtn.addEventListener("click", () => {
            fetch("/api/adworm/sync", { method: "POST" })
                .then(() => alert("AdWorm synced"))
                .catch(() => alert("Sync failed"));
        });
    }

    if (diagBtn) {
        diagBtn.addEventListener("click", () => {
            fetch("/api/adworm/diagnostics")
                .then(r => r.json())
                .then(data => alert("Diagnostics complete: " + JSON.stringify(data)))
                .catch(() => alert("Diagnostics failed"));
        });
    }
}

// Auto-init
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        initSurface();
        initAdWormDashboard();
    });
} else {
    initSurface();
    initAdWormDashboard();
}
