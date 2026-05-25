/**
 * Broadcast Control Surface Module
 * Handles broadcast status, history loading, message sending, and sync actions.
 */

import { initSurface } from "./surface.js";

export function initBroadcastSurface() {
    loadStatus();
    loadHistory();
    wireActions();
}

/**
 * Load broadcast engine status.
 */
function loadStatus() {
    fetch("/api/broadcast/status")
        .then(r => r.json())
        .then(data => {
            const el = document.getElementById("broadcast-status");
            if (el) el.innerText = data.status || "UNKNOWN";
        })
        .catch(() => {
            const el = document.getElementById("broadcast-status");
            if (el) el.innerText = "UNAVAILABLE";
        });
}

/**
 * Load broadcast history.
 */
function loadHistory() {
    fetch("/api/broadcast/history")
        .then(r => r.json())
        .then(data => {
            const list = document.getElementById("broadcast-history");
            if (!list) return;

            list.innerHTML = "";
            data.history.forEach(item => {
                const li = document.createElement("li");
                li.innerText = item.timestamp + ": " + item.message;
                list.appendChild(li);
            });
        })
        .catch(() => {
            const list = document.getElementById("broadcast-history");
            if (list) list.innerHTML = "<li>Unavailable</li>";
        });
}

/**
 * Wire up broadcast actions.
 */
function wireActions() {
    const sendBtn = document.getElementById("send-broadcast");
    const syncBtn = document.getElementById("sync-broadcast");

    if (sendBtn) {
        sendBtn.addEventListener("click", () => {
            const msgEl = document.getElementById("broadcast-message");
            if (!msgEl) return;

            const msg = msgEl.value.trim();
            if (!msg) {
                alert("Message cannot be empty");
                return;
            }

            fetch("/api/broadcast/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: msg })
            })
            .then(() => {
                alert("Broadcast sent");
                location.reload();
            })
            .catch(() => alert("Send failed"));
        });
    }

    if (syncBtn) {
        syncBtn.addEventListener("click", () => {
            fetch("/api/broadcast/sync", { method: "POST" })
                .then(() => alert("Broadcast engine synced"))
                .catch(() => alert("Sync failed"));
        });
    }
}

// Auto-init
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        initSurface();
        initBroadcastSurface();
    });
} else {
    initSurface();
    initBroadcastSurface();
}
