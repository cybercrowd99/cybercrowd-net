/**
 * CyberCrowd Dashboard Routing Module
 * Handles dashboard → surface navigation and action routing.
 */

/**
 * Open a surface by filename.
 * Example: openSurface("profile-setup.html")
 */
export function openSurface(surfaceFile) {
    if (!surfaceFile) {
        console.warn("openSurface called with no file");
        return;
    }

    window.location.href = "/" + surfaceFile;
}

/**
 * Wire dashboard buttons to their surfaces.
 */
export function wireDashboardRoutes() {
    const routes = {
        "btn-profile-setup": "profile-setup.html",
        "btn-creator-control": "creator-control.html",
        "btn-adworm-dashboard": "adworm.dashboard.html",
        "btn-broadcast": "broadcast.html",
        "btn-operations-dashboard": "operations-dashboard.html"
    };

    Object.entries(routes).forEach(([btnId, file]) => {
        const btn = document.getElementById(btnId);
        if (!btn) return;

        btn.addEventListener("click", () => openSurface(file));
    });
}

/**
 * Auto‑init on page load.
 */
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wireDashboardRoutes);
} else {
    wireDashboardRoutes();
}
