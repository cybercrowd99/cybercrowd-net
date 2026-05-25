/**
 * Global Surface Engine
 * Applies shared behavior to all surface panels.
 */

export function initSurface() {
    applySurfaceTheme();
    wireBackButton();
    announceSurfaceLoad();
}

/**
 * Applies theme or layout adjustments.
 */
function applySurfaceTheme() {
    document.body.classList.add("surface-active");
}

/**
 * Ensures the back button always returns to dashboard.
 */
function wireBackButton() {
    const btn = document.querySelector(".surface-header button");
    if (!btn) return;

    btn.addEventListener("click", () => {
        window.location.href = "/dashboard.html";
    });
}

/**
 * Broadcasts a surface load event (future runtime hooks).
 */
function announceSurfaceLoad() {
    console.log("[surface] loaded:", window.location.pathname);
}

// Auto-init
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSurface);
} else {
    initSurface();
}
