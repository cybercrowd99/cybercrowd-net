const HEARTBEAT_TIMEOUT = 15000;

const surfaceState = {};

function registerHeartbeat(surfaceId) {

    if (!surfaceId) {
        return;
    }

    if (!surfaceState[surfaceId]) {

        surfaceState[surfaceId] = {
            id: surfaceId,
            status: "online",
            last_seen: Date.now()
        };

    } else {

        surfaceState[surfaceId].status =
        "online";

        surfaceState[surfaceId].last_seen =
        Date.now();
    }
}

function markOfflineSurfaces() {

    const now =
    Date.now();

    Object.values(surfaceState)
    .forEach((surface) => {

        if (
            now - surface.last_seen >
            HEARTBEAT_TIMEOUT
        ) {

            surface.status =
            "offline";
        }
    });
}

function getSurfaceState() {

    markOfflineSurfaces();

    return surfaceState;
}

function getSurfaceStatus(surfaceId) {

    markOfflineSurfaces();

    if (!surfaceState[surfaceId]) {

        return {
            id: surfaceId,
            status: "unknown"
        };
    }

    return surfaceState[surfaceId];
}

function startHeartbeatMonitor() {

    setInterval(() => {

        markOfflineSurfaces();

    }, 3000);

    console.log(
        "SURFACE HEARTBEAT MONITOR ACTIVE"
    );
}

module.exports = {
    registerHeartbeat,
    getSurfaceState,
    getSurfaceStatus,
    startHeartbeatMonitor
};