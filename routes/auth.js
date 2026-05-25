/**
 * CyberCrowd Auth Routing Module
 * Handles session validation, login redirect, and logout.
 */

/**
 * Check if a valid session token exists.
 */
export function hasSession() {
    const token = localStorage.getItem("cc_access");
    return token && token.length > 10;
}

/**
 * Redirect to login if no session exists.
 */
export function requireSession() {
    if (!hasSession()) {
        window.location.href = "/login.html";
    }
}

/**
 * Log the user out and clear session.
 */
export function logout() {
    localStorage.removeItem("cc_access");
    window.location.href = "/login.html";
}

/**
 * Auto‑check session on protected pages.
 */
export function protectPage() {
    const protectedPaths = [
        "dashboard.html",
        "profile-setup.html",
        "creator-control.html",
        "adworm.dashboard.html",
        "broadcast.html",
        "operations-dashboard.html"
    ];

    const current = window.location.pathname.split("/").pop();

    if (protectedPaths.includes(current)) {
        requireSession();
    }
}

/**
 * Auto‑init on page load.
 */
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", protectPage);
} else {
    protectPage();
}
