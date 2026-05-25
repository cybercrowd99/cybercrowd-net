export function initCoreItems() {
    const core = document.querySelector("#dashboard .core");
    if (!core) return;

    core.innerHTML = "";

    const items = [
        {
            label: "System Status",
            value: "ONLINE",
            class: "good"
        },
        {
            label: "Latency",
            value: "LOW",
            class: "good"
        },
        {
            label: "Session Integrity",
            value: "STABLE",
            class: "good"
        }
    ];

    items.forEach((item) => {
        const el = document.createElement("div");
        el.className = "item";
        el.innerHTML =
            "<strong>" + item.label + "</strong><br>" +
            "<span class='" + item.class + "'>" + item.value + "</span>";
        core.appendChild(el);
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCoreItems);
} else {
    initCoreItems();
}
