const SNAP_THRESHOLD = 40;

export function initDashboardDock(dashboardEl, onDockChange) {
    const dockButton = dashboardEl.querySelector("[data-action='dock-toggle']");

    if (dockButton) {
        dockButton.addEventListener("click", () => {
            toggleDock(dashboardEl, onDockChange);
        });
    }

    dashboardEl.addEventListener("dashboard:drag-stop", () => {
        autoSnap(dashboardEl, onDockChange);
    });
}

export function autoSnap(dashboardEl, onDockChange) {
    const rect = dashboardEl.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const distRight = vw - (rect.left + rect.width);
    const distBottom = vh - (rect.top + rect.height);

    const shouldDockRight = distRight < SNAP_THRESHOLD;
    const shouldDockBottom = distBottom < SNAP_THRESHOLD;

    if (shouldDockRight || shouldDockBottom) {
        dashboardEl.style.position = "fixed";
        dashboardEl.style.right = "16px";
        dashboardEl.style.bottom = "16px";
        dashboardEl.style.left = "auto";
        dashboardEl.style.top = "auto";

        if (typeof onDockChange === "function") {
            onDockChange();
        }
    }
}

export function toggleDock(dashboardEl, onDockChange) {
    const style = window.getComputedStyle(dashboardEl);
    const isDocked =
        style.right !== "auto" || style.bottom !== "auto";

    if (isDocked) {
        const rect = dashboardEl.getBoundingClientRect();
        dashboardEl.style.position = "fixed";
        dashboardEl.style.top = rect.top + "px";
        dashboardEl.style.left = rect.left + "px";
        dashboardEl.style.right = "auto";
        dashboardEl.style.bottom = "auto";
    } else {
        dashboardEl.style.position = "fixed";
        dashboardEl.style.bottom = "16px";
        dashboardEl.style.right = "16px";
        dashboardEl.style.top = "auto";
        dashboardEl.style.left = "auto";
    }

    if (typeof onDockChange === "function") {
        onDockChange();
    }
}
