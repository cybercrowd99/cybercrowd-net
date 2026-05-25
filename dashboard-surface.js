/* ============================================================
   CyberCrowd Dashboard Surface Runtime
   Reconstructed clean from missing file state
   ============================================================ */

console.log("[dashboard-surface] runtime starting…");

const dashRoot = document.getElementById("dashboard-surface");
if (!dashRoot) {
    console.error("[dashboard-surface] root element missing");
}

/* ---------- IDENTITY + TIER LOADING ---------- */

async function loadIdentity() {
    try {
        const res = await fetch("/api/identity", { credentials: "include" });
        if (!res.ok) throw new Error("identity fetch failed");

        const data = await res.json();

        document.getElementById("dash-display-name").textContent = data.displayName || "Unknown";
        document.getElementById("dash-tier").textContent = "Tier: " + (data.tier || "—");

        console.log("[dashboard-surface] identity loaded:", data);
    } catch (err) {
        console.error("[dashboard-surface] identity error:", err);
        document.getElementById("dash-display-name").textContent = "Error";
        document.getElementById("dash-tier").textContent = "Tier: —";
    }
}

/* ---------- SYSTEM STATUS ---------- */

async function loadSystemStatus() {
    const pill = document.getElementById("dash-system-status");

    try {
        const res = await fetch("/api/system-status");
        if (!res.ok) throw new Error("system status failed");

        const data = await res.json();
        pill.textContent = "System: " + (data.status || "UNKNOWN");
        pill.classList.add("status-ok");

        console.log("[dashboard-surface] system status:", data);
    } catch (err) {
        console.error("[dashboard-surface] system status error:", err);
        pill.textContent = "System: ERROR";
        pill.classList.add("status-error");
    }
}

/* ---------- ACTIVITY LOG ---------- */

async function loadActivityLog() {
    const list = document.getElementById("dash-activity-log");
    list.innerHTML = "";

    try {
        const res = await fetch("/api/activity");
        if (!res.ok) throw new Error("activity fetch failed");

        const data = await res.json();

        data.events.forEach(ev => {
            const li = document.createElement("li");
            li.textContent = ev;
            list.appendChild(li);
        });

        console.log("[dashboard-surface] activity log loaded");
    } catch (err) {
        console.error("[dashboard-surface] activity log error:", err);
        const li = document.createElement("li");
        li.textContent = "Unable to load activity.";
        list.appendChild(li);
    }
}

/* ---------- NAVIGATION HANDLERS ---------- */

function bindNavigation() {
    document.querySelectorAll("[data-nav]").forEach(btn => {
        btn.addEventListener("click", () => {
            const target = btn.getAttribute("data-nav");
            console.log("[dashboard-surface] navigating to:", target);
            window.location.href = target;
        });
    });
}

/* ---------- DRAGGING (FALLBACK ENGINE) ---------- */

function enableDrag() {
    let isDown = false;
    let offset = { x: 0, y: 0 };

    dashRoot.addEventListener("mousedown", e => {
        isDown = true;
        offset.x = dashRoot.offsetLeft - e.clientX;
        offset.y = dashRoot.offsetTop - e.clientY;
    });

    document.addEventListener("mouseup", () => isDown = false);

    document.addEventListener("mousemove", e => {
        if (!isDown) return;
        dashRoot.style.left = (e.clientX + offset.x) + "px";
        dashRoot.style.top = (e.clientY + offset.y) + "px";
    });

    console.log("[dashboard-surface] drag enabled (fallback)");
}

/* ---------- INITIALIZE EVERYTHING ---------- */

async function initDashboardSurface() {
    console.log("[dashboard-surface] initializing…");

    bindNavigation();
    enableDrag();

    await loadIdentity();
    await loadSystemStatus();
    await loadActivityLog();

    console.log("[dashboard-surface] ready.");
}

initDashboardSurface();
