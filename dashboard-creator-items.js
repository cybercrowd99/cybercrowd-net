export function initCreatorItems() {
    const creator = document.querySelector("#dashboard .creator");
    if (!creator) return;

    creator.innerHTML = "";

    const items = [
        {
            label: "Revenue Engine",
            value: "ACTIVE",
            class: "good"
        },
        {
            label: "Broadcast Readiness",
            value: "READY",
            class: "good"
        },
        {
            label: "adWorm Integration",
            value: "CONNECTED",
            class: "good"
        },
        {
            label: "Creator Analytics",
            value: "LIVE",
            class: "good"
        },
        {
            label: "Storefront Status",
            value: "ONLINE",
            class: "good"
        },
        {
            label: "MAP Identity",
            value: "UPGRADED",
            class: "warning"
        }
    ];

    items.forEach((item) => {
        const el = document.createElement("div");
        el.className = "item";
        el.innerHTML =
            "<strong>" + item.label + "</strong><br>" +
            "<span class='" + item.class + "'>" + item.value + "</span>";
        creator.appendChild(el);
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCreatorItems);
} else {
    initCreatorItems();
}
