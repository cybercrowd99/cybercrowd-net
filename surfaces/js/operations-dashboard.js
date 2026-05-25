/**
 * Operations Dashboard Surface Module
 * Handles system health, service map, environment info, sync, and diagnostics.
 */

import { initSurface } from "./surface.js";

export function initOperationsDashboard() {
    loadHealth();
    loadServices();
    loadEnvironment();
    wireActions();
}

/**
 * Load system health metrics.
 */
function loadHealth() {
    fetch("/api/ops/health")
        .then(r => r.json())
        .then(data => {
            const status = document.getElementById("ops-status");
            const uptime = document.getElementById("ops-uptime");
            const load = document.getElementById("ops-load");

            if (status) status.innerText = data.status || "UNKNOWN";
            if (uptime) uptime.innerText = data.uptime || "0s";
            if (load) load.innerText = data.load || "0%";
        })
        .catch(() => {
            const status = document.getElementById("ops-status");
            const uptime = document.getElementById("ops-uptime");
            const load = document.getElementById("ops-load");

            if (status) status.innerText = "UNAVAILABLE";
            if (uptime) uptime.innerText = "N/A";
            if (load) load.innerText = "N/A";
        });
}

/**
 * Load service map.
 */
function loadServices() {
    fetch("/api/ops/services")
        .then(r => r.json())
        .then(data => {
            const list = document.getElementById("ops-services");
            if (!list) return;

            list.innerHTML = "";
            data.services.forEach(svc => {
                const li = document.createElement("li");
                li.innerText = svc.name + " — " + svc.status;
                list.appendChild(li);
            });
        })
        .catch(() => {
            const list = document.getElementById("ops-services");
            if (list) list.innerHTML = "<li>Unavailable</li>";
        });
}

/**
 * Load environment details.
 */
function loadEnvironment() {
    fetch("/api/ops/env")
        .then(r => r.json())
        .then(data => {
            const region = document.getElementById("ops-region");
            const version = document.getElementById("ops-version");
            const build = document.getElementById("ops-build");

            if (region) region.innerText = data.region || "UNKNOWN";
            if (version) version.innerText = data.version || "N/A";
            if (build) build.innerText = data.build || "N/A";
        })
        .catch(() => {
            const region = document.getElementById("ops-region");
            const version = document.getElementById("ops-version");
            const build = document.getElementById("ops-build");

            if (region) region.innerText = "UNAVAILABLE";
            if (version) version.innerText = "N/A";
            if (build) build.innerText = "N/A";
        });
}

/**
 * Wire up operational actions.
 */
function wireActions() {
    const syncBtn = document.getElementById("ops-sync");
    const diagBtn = document.getElementById("ops-diagnostics");

    if (syncBtn) {
        syncBtn.addEventListener("click", () => {
            fetch("/api/ops/sync", { method: "POST" })
                .then(() => alert("System synced"))
                .catch(() => alert("Sync failed"));
        });
    }

    if (diagBtn) {
        diagBtn.addEventListener("click", () => {
            fetch("/api/ops/diagnostics")
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
        initOperationsDashboard();
    });
} else {
    initSurface();
    initOperationsDashboard();
}
