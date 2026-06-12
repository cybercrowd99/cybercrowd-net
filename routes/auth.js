/**
 * CyberCrowd Auth Routing Module (Stabilized)
 * Handles session validation, login redirect, and logout.
 */

/* ------------------------------
   SESSION CHECK
------------------------------ */
export function hasSession() {
    const token = localStorage.getItem("cc_access");

    // Token must exist and follow expected pattern
    return typeof token === "string" && token.startsWith("cc_");
}

/* ------------------------------
   SAFE REDIRECT HANDLER
------------------------------ */
export function requireSession() {
    const current = window.location.pathname.split("/").pop();

    // Pages that must NEVER redirect
    const publicPages = [
        "login.html",
        "create-account.html",
        "set-password.html",
        "index.html",
        ""
    ];

    if (publicPages.includes(current)) {
        return; // Do nothing — these pages are allowed without session
    }

    // If no session, redirect to login
    if (!hasSession()) {
        window.location.href = "/login.html";
    }
}

/* ------------------------------
   LOGOUT
------------------------------ */
export function logout() {
    localStorage.removeItem("cc_access");
    window.location.href = "/login.html";
}

/* ------------------------------
   PROTECTED PAGES
------------------------------ */
export function protectPage() {
    const protectedPaths = [
        "dashboard.html",
        "creator-control.html",
        "adworm.dashboard.html",
        "broadcast.html",
        "operations-dashboard.html"
        // NOTE: profile-setup.html REMOVED — it caused loops
    ];

    const current = window.location.pathname.split("/").pop();

    if (protectedPaths.includes(current)) {
        requireSession();
    }
}

/* ------------------------------
   AUTO-INIT
------------------------------ */
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", protectPage);
} else {
    protectPage();
}
