export function initDashboardActions() {
    const dashboard = document.getElementById("dashboard");
    if (!dashboard) return;

    const actionButtons = dashboard.querySelectorAll("[data-action-trigger]");

    actionButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            const action = btn.getAttribute("data-action-trigger");
            runDashboardAction(action);
        });
    });
}

function runDashboardAction(action) {
    switch (action) {
        case "open-profile":
            openSurface("/profile.html");
            break;

        case "open-creator-tools":
            openSurface("/creator-control.html");
            break;

        case "open-adworm":
            openSurface("/adworm.dashboard.html");
            break;

        case "open-broadcast":
            openSurface("/broadcast.html");
            break;

        case "open-operations":
            openSurface("/operations-dashboard.html");
            break;

        default:
            console.warn("Unknown dashboard action:", action);
            break;
    }
}

function openSurface(url) {
    window.location.href = url;
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDashboardActions);
} else {
    initDashboardActions();
}
