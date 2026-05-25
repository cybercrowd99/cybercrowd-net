let socket = null;

export function initDashboardRuntime() {
    connectWebSocket();
}

function connectWebSocket() {
    try {
        socket = new WebSocket(getSocketURL());

        socket.addEventListener("open", () => {
            console.log("[dashboard-runtime] connected");
            sendHello();
        });

        socket.addEventListener("message", (evt) => {
            handleRuntimeEvent(evt.data);
        });

        socket.addEventListener("close", () => {
            console.warn("[dashboard-runtime] disconnected, retrying in 3s");
            setTimeout(connectWebSocket, 3000);
        });

        socket.addEventListener("error", () => {
            console.warn("[dashboard-runtime] socket error");
        });
    } catch (err) {
        console.error("[dashboard-runtime] failed to connect", err);
        setTimeout(connectWebSocket, 3000);
    }
}

function getSocketURL() {
    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    return protocol + "//" + location.host + "/ws/dashboard";
}

function sendHello() {
    send({
        type: "hello",
        surface: "dashboard",
        timestamp: Date.now()
    });
}

function send(payload) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(payload));
    }
}

function handleRuntimeEvent(raw) {
    let msg = null;

    try {
        msg = JSON.parse(raw);
    } catch {
        console.warn("[dashboard-runtime] invalid message", raw);
        return;
    }

    switch (msg.type) {
        case "heartbeat-update":
            updateHeartbeat(msg.data);
            break;

        case "continuity-event":
            updateContinuity(msg.data);
            break;

        case "presence-update":
            updatePresence(msg.data);
            break;

        case "tier-update":
            applyTier(msg.tier);
            break;

        default:
            console.warn("[dashboard-runtime] unknown event", msg);
            break;
    }
}

function updateHeartbeat(data) {
    const panel = document.querySelector("#dashboard .core");
    if (!panel) return;

    const el = document.createElement("div");
    el.className = "item";
    el.innerHTML =
        "<strong>Live Heartbeat</strong><br>" +
        "<span class='good'>" + (data.status || "ONLINE") + "</span>";

    panel.appendChild(el);
}

function updateContinuity(data) {
    const panel = document.querySelector("#dashboard .member");
    if (!panel) return;

    const el = document.createElement("div");
    el.className = "item";
    el.innerHTML =
        "<strong>Continuity Event</strong><br>" +
        "<span class='warning'>" + data.event + "</span>";

    panel.appendChild(el);
}

function updatePresence(data) {
    const panel = document.querySelector("#dashboard .creator");
    if (!panel) return;

    const el = document.createElement("div");
    el.className = "item";
    el.innerHTML =
        "<strong>Presence</strong><br>" +
        "<span class='good'>" + data.state + "</span>";

    panel.appendChild(el);
}

function applyTier(tier) {
    const dashboard = document.getElementById("dashboard");
    if (!dashboard) return;

    dashboard.setAttribute("data-tier", tier);
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDashboardRuntime);
} else {
    initDashboardRuntime();
}
