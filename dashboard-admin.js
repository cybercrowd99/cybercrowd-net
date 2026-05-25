export function initDashboardAdmin() {
    const dashboard = document.getElementById("dashboard");
    if (!dashboard) return;

    const adminButtons = dashboard.querySelectorAll("[data-admin]");

    adminButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            const cmd = btn.getAttribute("data-admin");
            runAdminCommand(cmd);
        });
    });
}

function runAdminCommand(cmd) {
    switch (cmd) {
        case "maintenance-on":
            sendAdminOverride("maintenance-on");
            break;

        case "maintenance-off":
            sendAdminOverride("maintenance-off");
            break;

        case "security-lockdown":
            sendAdminOverride("security-lockdown");
            break;

        case "security-release":
            sendAdminOverride("security-release");
            break;

        case "global-reset":
            sendAdminOverride("global-reset");
            break;

        case "system-restart":
            sendAdminOverride("system-restart");
            break;

        default:
            console.warn("[admin] unknown command:", cmd);
            break;
    }
}

function sendAdminOverride(type) {
    fetch("/api/admin/override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type })
    })
        .then(() => {
            console.log("[admin] override sent:", type);
        })
        .catch(() => {
            console.warn("[admin] failed to send override:", type);
        });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDashboardAdmin);
} else {
    initDashboardAdmin();
}
