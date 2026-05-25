export function initDashboardOperator() {
    const dashboard = document.getElementById("dashboard");
    if (!dashboard) return;

    const operatorButtons = dashboard.querySelectorAll("[data-operator]");

    operatorButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            const op = btn.getAttribute("data-operator");
            runOperatorCommand(op);
        });
    });
}

function runOperatorCommand(op) {
    switch (op) {
        case "diagnostics":
            runDiagnostics();
            break;

        case "flush-cache":
            sendAdminSignal("flush-cache");
            break;

        case "reload-surfaces":
            sendAdminSignal("reload-surfaces");
            break;

        case "reset-session":
            sendAdminSignal("reset-session");
            break;

        case "runtime-dump":
            requestRuntimeDump();
            break;

        default:
            console.warn("[operator] unknown command:", op);
            break;
    }
}

function runDiagnostics() {
    console.log("[operator] running diagnostics…");

    fetch("/api/diagnostics")
        .then(r => r.json())
        .then(data => {
            console.log("[operator] diagnostics:", data);
            alert("Diagnostics complete");
        })
        .catch(() => {
            console.warn("[operator] diagnostics failed");
        });
}

function sendAdminSignal(type) {
    fetch("/api/admin/signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type })
    })
        .then(() => {
            console.log("[operator] signal sent:", type);
        })
        .catch(() => {
            console.warn("[operator] failed to send signal:", type);
        });
}

function requestRuntimeDump() {
    fetch("/api/runtime/dump")
        .then(r => r.json())
        .then(data => {
            console.log("[operator] runtime dump:", data);
        })
        .catch(() => {
            console.warn("[operator] runtime dump failed");
        });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDashboardOperator);
} else {
    initDashboardOperator();
}
