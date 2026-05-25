import { setDashboardTier, toggleDashboardCollapse } from "./dashboard.js";
import { toggleDock } from "./dashboard-dock.js";

export function initDashboardControls() {
    const dashboardEl = document.getElementById("dashboard");
    if (!dashboardEl) return;

    const tierButtons = dashboardEl.querySelectorAll("[data-tier]");
    const collapseButton = dashboardEl.querySelector("[data-action='collapse']");
    const dockButton = dashboardEl.querySelector("[data-action='dock-toggle']");

    tierButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            const tier = btn.getAttribute("data-tier");
            setDashboardTier(tier);
        });
    });

    if (collapseButton) {
        collapseButton.addEventListener("click", () => {
            toggleDashboardCollapse();
        });
    }

    if (dockButton) {
        dockButton.addEventListener("click", () => {
            toggleDock(dashboardEl, () => {
                // state saved by dashboard.js
            });
        });
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDashboardControls);
} else {
    initDashboardControls();
}
