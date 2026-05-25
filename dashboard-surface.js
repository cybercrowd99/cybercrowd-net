/**
 * CyberCrowd Dashboard Surface Module
 * Handles identity loading, system status, quick actions, and activity log.
 */

console.log("Dashboard Surface Loaded");

/**
 * Load identity (display name + tier)
 */
async function loadIdentity() {
    try {
        const res = await fetch("/api/identity");
        const data = await res.json();

        const nameEl = document.getElementById("dash-display-name");
        const tierEl = document.getElementById("dash-tier");

        if (nameEl) nameEl.textContent = data.displayName || "Unknown User";
        if (tierEl) tierEl.textContent = "Tier: " + (data.tier || "—");

    } catch (err) {
        console.error("Identity load failed:", err);
    }
}

/**
 * Load system status
 */
async function loadSystemStatus() {
    try {
        const res = await fetch("/api/system/status");
        const data = await res.json();

        const el = document.getElementById("dash-system-status");
        if (el) el.textContent = "System: " + (data.status || "UNKNOWN");

    } catch (err) {
        const el = document.getElementById("dash-system-status");
        if (el) el.textContent = "System: UNAVAILABLE";
    }
}

/**
 * Load recent activity
 */
async function loadActivity() {
    try {
        const res = await fetch("/api/activity");
        const data = await res.json();

        const list = document.getElementById("dash-activity-log");
        if (!list) return;

        list.innerHTML = "";

        data.items.forEach(item => {
            const li = document.createElement("li");
            li.textContent = `${item.timestamp}: ${item.event}`;
            list.appendChild(li);
        });

    } catch (err) {
        console.error("Activity load failed:", err);
    }
}

/**
 * Wire quick action navigation
 */
function wireNavigation() {
    document.querySelectorAll("[data-nav]").forEach(btn => {
        btn.addEventListener("click", () => {
            const target = btn.getAttribute("data-nav");
            if (target) window.location.href = target;
        });
    });
}

/**
 * Initialize dashboard
 */
function initDashboard() {
    loadIdentity();
    loadSystemStatus();
    loadActivity();
    wireNavigation();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDashboard);
} else {
    initDashboard();
}
