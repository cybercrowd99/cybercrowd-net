export function initDashboardIntegrations() {
    loadHeartbeat();
    loadContinuityRegistry();
    loadSessionTier();

    // refresh every 5 seconds
    setInterval(() => {
        loadHeartbeat();
        loadSessionTier();
    }, 5000);
}

async function loadHeartbeat() {
    try {
        const res = await fetch("/api/heartbeat");
        const data = await res.json();

        updateHeartbeatPanel(data);
    } catch (err) {
        console.warn("Heartbeat unavailable");
    }
}

async function loadContinuityRegistry() {
    try {
        const res = await fetch("/continuity-registry.json");
        const data = await res.json();

        updateContinuityPanel(data);
    } catch (err) {
        console.warn("Continuity registry unavailable");
    }
}

async function loadSessionTier() {
    try {
        const res = await fetch("/api/session");
        const data = await res.json();

        if (data && data.tier) {
            applyTierToDashboard(data.tier);
        }
    } catch (err) {
        console.warn("Session tier unavailable");
    }
}

function updateHeartbeatPanel(data) {
    const panel = document.querySelector("#dashboard .core");
    if (!panel) return;

    const el = document.createElement("div");
    el.className = "item";
    el.innerHTML =
        "<strong>Heartbeat</strong><br>" +
        "<span class='good'>" + (data.status || "ONLINE") + "</span>";

    panel.appendChild(el);
}

function updateContinuityPanel(data) {
    const panel = document.querySelector("#dashboard .member");
    if (!panel) return;

    const el = document.createElement("div");
    el.className = "item";
    el.innerHTML =
        "<strong>Continuity Modes</strong><br>" +
        "<span class='good'>" + Object.keys(data.continuity_modes).length + " modes</span>";

    panel.appendChild(el);
}

function applyTierToDashboard(tier) {
    const dashboard = document.getElementById("dashboard");
    if (!dashboard) return;

    dashboard.setAttribute("data-tier", tier);
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDashboardIntegrations);
} else {
    initDashboardIntegrations();
}
