export async function loadDashboard() {
    // prevent double injection
    if (document.getElementById("dashboard")) return;

    // load CSS
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "/dashboard.css";
    document.head.appendChild(css);

    // fetch HTML shell
    const html = await fetch("/dashboard.html").then(r => r.text());

    // inject HTML
    const container = document.createElement("div");
    container.innerHTML = html.trim();
    document.body.appendChild(container.firstElementChild);

    // load modules
    await import("/dashboard.js");
    await import("/dashboard-drag.js");
    await import("/dashboard-dock.js");
    await import("/dashboard-controls.js");
}

// auto-load on every page
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadDashboard);
} else {
    loadDashboard();
}
