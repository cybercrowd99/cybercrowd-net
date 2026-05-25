/**
 * CyberCrowd Surface Routing Module
 * Maps surface HTML files to their JS runtime modules.
 */

const surfaceRoutes = {
    "profile-setup.html": "/surfaces/js/profile-setup.js",
    "creator-control.html": "/surfaces/js/creator-control.js",
    "adworm.dashboard.html": "/surfaces/js/adworm.dashboard.js",
    "broadcast.html": "/surfaces/js/broadcast.js",
    "operations-dashboard.html": "/surfaces/js/operations-dashboard.js"
};

/**
 * Load and initialize the correct JS module for the current surface.
 */
export async function loadSurfaceModule() {
    const path = window.location.pathname.split("/").pop();

    if (!surfaceRoutes[path]) {
        console.warn("No surface route found for:", path);
        return;
    }

    try {
        const modulePath = surfaceRoutes[path];
        const module = await import(modulePath);

        // Each module exports init<SurfaceName>()
        const initFn = Object.values(module).find(fn => typeof fn === "function");

        if (initFn) {
            initFn();
        } else {
            console.warn("Surface module loaded but no init function found:", modulePath);
        }
    } catch (err) {
        console.error("Failed to load surface module:", err);
    }
}

/**
 * Auto‑init on page load.
 */
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadSurfaceModule);
} else {
    loadSurfaceModule();
}
