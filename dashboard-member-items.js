export function initMemberItems() {
    const member = document.querySelector("#dashboard .member");
    if (!member) return;

    member.innerHTML = "";

    const items = [
        {
            label: "Session Analytics",
            value: "ACTIVE",
            class: "good"
        },
        {
            label: "Node Visibility",
            value: "ENABLED",
            class: "good"
        },
        {
            label: "Member Sync",
            value: "OPTIMAL",
            class: "good"
        },
        {
            label: "Surface Access",
            value: "EXTENDED",
            class: "warning"
        }
    ];

    items.forEach((item) => {
        const el = document.createElement("div");
        el.className = "item";
        el.innerHTML =
            "<strong>" + item.label + "</strong><br>" +
            "<span class='" + item.class + "'>" + item.value + "</span>";
        member.appendChild(el);
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMemberItems);
} else {
    initMemberItems();
}
