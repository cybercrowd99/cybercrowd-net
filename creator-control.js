/**
 * CyberCrowd Creator Control Surface Module
 * Handles module routing, action triggers, and surface engine integration.
 */

console.log("Creator Control Surface Loaded");

const statusBox = document.getElementById("creator-status");

function setStatus(msg) {
    if (!statusBox) return;
    statusBox.textContent = msg;
}

/**
 * Routing table for module actions
 */
const moduleRoutes = {
    "open-identity": "/surfaces/identity.html",
    "open-assets": "/surfaces/assets.html",
    "open-broadcast": "/surfaces/broadcast.html",
    "open-operations": "/surfaces/operations.html"
};

/**
 * Handle module button clicks
 */
function handleModuleAction(action) {
    const target = moduleRoutes[action];

    if (!target) {
        setStatus("Unknown module: " + action);
        return;
    }

    setStatus("Opening module...");

    // Surface Engine Navigation
    window.location.href = target;
}

/**
 * Wire all module buttons
 */
document.querySelectorAll("[data-action]").forEach(btn => {
    btn.addEventListener("click", () => {
        const action = btn.getAttribute("data-action");
        handleModuleAction(action);
    });
});

setStatus("Creator Control Ready");
