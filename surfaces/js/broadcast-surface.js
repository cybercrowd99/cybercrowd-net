/**
 * Broadcast Surface Panel Logic
 * Standalone module for broadcast-surface.html
 * Does NOT interfere with surfaces/js/broadcast.js
 */

console.log("Broadcast Surface Panel Loaded");

const statusBox = document.getElementById("broadcast-status");

function setStatus(msg) {
    if (!statusBox) return;
    statusBox.textContent = msg;
}

/**
 * Placeholder routing/actions for the broadcast-surface.html panel
 */
document.querySelectorAll("[data-action]").forEach(btn => {
    btn.addEventListener("click", () => {
        const action = btn.getAttribute("data-action");
        setStatus("Action triggered: " + action);
    });
});

setStatus("Broadcast Surface Ready");
