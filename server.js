const express = require("express");
const http = require("http");
const qrcode = require("qrcode-terminal");
const os = require("os");
const path = require("path");

const {
    createTransport
} = require("./websocket-transport");

const osAuthority =
require("./os-authority-windows");

const {
    createNodeBridge
} = require("./node-bridge");

const {
    loadConfig,
    getConfig
} = require("./config-loader");

const {
    loadCursorPreferences,
    getDefaultCursorProfile
} = require("./cursor-style-loader");

const {
    loadSurfaceRegistry,
    getSurfaceRegistry,
    getCurrentOwner,
    isTabletopTrialEnabled
} = require("./surface-registry-loader");

const {
    registerHeartbeat,
    getSurfaceState,
    startHeartbeatMonitor
} = require("./surface-heartbeat");

const {
    loadRetentionPolicy
} = require("./retention-policy-loader");

const {
    loadRetentionEventRegistry
} = require("./retention-event-loader");

const {
    createSimulatedEvent,
    getSimulatedEvents,
    clearSimulatedEvents
} = require("./retention-event-simulator");

const {
    loadContinuityRegistry
} = require("./continuity-loader");

const {
    loadContinuityEventRegistry
} = require("./continuity-event-loader");

const {
    createContinuityEvent,
    getContinuityEvents,
    clearContinuityEvents
} = require("./continuity-simulator");

const {
    createBroadcast,
    getBroadcasts,
    clearBroadcasts
} = require("./continuity-broadcast-api");

/* ------------------------------------------------ */
/* LOAD SYSTEMS                                     */
/* ------------------------------------------------ */

loadConfig();
const config = getConfig();

loadCursorPreferences();
const defaultCursor = getDefaultCursorProfile();

loadSurfaceRegistry();
const surfaceRegistry = getSurfaceRegistry();

loadRetentionPolicy();
loadRetentionEventRegistry();

loadContinuityRegistry();
loadContinuityEventRegistry();

osAuthority.applyConfig(config);
startHeartbeatMonitor();

/* ------------------------------------------------ */
/* APP                                              */
/* ------------------------------------------------ */

const app = express();
const server = http.createServer(app);

const PORT = config.bridge.port;
const laptopSurface = config.surfaces.laptop;
const phoneSurface = config.surfaces.phone;

/* ------------------------------------------------ */
/* NETWORK                                          */
/* ------------------------------------------------ */

function getLocalIP() {
    const nets = os.networkInterfaces();

    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === "IPv4" && !net.internal) {
                return net.address;
            }
        }
    }

    return "localhost";
}

/* ------------------------------------------------ */
/* TRANSPORT                                        */
/* ------------------------------------------------ */

const transport = createTransport(server);

const nodeBridge = createNodeBridge({
    transport,
    osAuthority,
    config
});

transport.onMessage((data) => {
    if (data.type === "heartbeat" && data.surfaceId) {
        registerHeartbeat(data.surfaceId);
        return;
    }

    nodeBridge.handleMessage(data);
});

/* ------------------------------------------------ */
/* STATIC FILES                                     */
/* ------------------------------------------------ */

app.use(express.static(__dirname));

/* ------------------------------------------------ */
/* SURFACES                                         */
/* ------------------------------------------------ */

if (laptopSurface.enabled) {
    app.get(laptopSurface.route, (req, res) => {
        registerHeartbeat("laptop");

        res.sendFile(
            path.join(__dirname, laptopSurface.file)
        );
    });
}

if (phoneSurface.enabled) {
    app.get(phoneSurface.route, (req, res) => {
        registerHeartbeat("phone");

        res.sendFile(
            path.join(__dirname, phoneSurface.file)
        );
    });
}

/* ------------------------------------------------ */
/* CORE APIs                                        */
/* ------------------------------------------------ */

app.get("/api/cursor-profile", (req, res) => {
    res.json({
        success: true,
        profile: defaultCursor
    });
});

app.get("/api/surface-registry", (req, res) => {
    res.json({
        success: true,
        registry: surfaceRegistry
    });
});

app.get("/api/tabletop-status", (req, res) => {
    res.json({
        success: true,
        tabletop_enabled: isTabletopTrialEnabled(),
        current_owner: getCurrentOwner(),
        surfaces: surfaceRegistry.surfaces,
        heartbeat: getSurfaceState()
    });
});

/* ------------------------------------------------ */
/* RETENTION EVENT APIs                             */
/* ------------------------------------------------ */

app.get("/api/retention-events", (req, res) => {
    res.json({
        success: true,
        events: getSimulatedEvents()
    });
});

app.get("/api/retention-events/simulate/:eventType", (req, res) => {
    const result = createSimulatedEvent(
        req.params.eventType,
        {
            source: "tabletop-simulation"
        }
    );

    res.json(result);
});

app.get("/api/retention-events/clear", (req, res) => {
    res.json(clearSimulatedEvents());
});

/* ------------------------------------------------ */
/* CONTINUITY EVENT APIs                            */
/* ------------------------------------------------ */

app.get("/api/continuity-events", (req, res) => {
    res.json({
        success: true,
        events: getContinuityEvents()
    });
});

app.get("/api/continuity-events/simulate/:eventType", (req, res) => {
    const result = createContinuityEvent(
        req.params.eventType,
        {
            source: "continuity-simulation"
        }
    );

    res.json(result);
});

app.get("/api/continuity-events/clear", (req, res) => {
    res.json(clearContinuityEvents());
});

/* ------------------------------------------------ */
/* CONTINUITY BROADCAST APIs                        */
/* ------------------------------------------------ */

app.get("/api/continuity-broadcasts", (req, res) => {
    res.json({
        success: true,
        broadcasts: getBroadcasts()
    });
});

app.get("/api/continuity-broadcasts/send/:severity/:message", (req, res) => {
    const result = createBroadcast({
        severity: req.params.severity,
        message: decodeURIComponent(req.params.message),
        source: "continuity-broadcast-api"
    });

    res.json(result);
});

app.get("/api/continuity-broadcasts/clear", (req, res) => {
    res.json(clearBroadcasts());
});

/* ------------------------------------------------ */
/* START                                            */
/* ------------------------------------------------ */

const ip = getLocalIP();

server.listen(PORT, () => {
    console.log("");
    console.log(config.bridge.name);
    console.log("");

    console.log("VERSION:");
    console.log(config.bridge.version);
    console.log("");

    console.log("TABLETOP TRIAL:");
    console.log(isTabletopTrialEnabled() ? "ENABLED" : "DISABLED");
    console.log("");

    console.log("CURRENT OWNER:");
    console.log(getCurrentOwner());
    console.log("");

    console.log("DEFAULT CURSOR:");
    console.log(defaultCursor.name);
    console.log("");

    console.log("LAPTOP:");
    console.log("http://" + ip + ":" + PORT);
    console.log("");

    console.log("PHONE:");
    console.log("http://" + ip + ":" + PORT + phoneSurface.route);
    console.log("");

    console.log("RETENTION EVENT API:");
    console.log("http://" + ip + ":" + PORT + "/api/retention-events");
    console.log("");

    console.log("CONTINUITY EVENT API:");
    console.log("http://" + ip + ":" + PORT + "/api/continuity-events");
    console.log("");

    console.log("CONTINUITY BROADCAST API:");
    console.log("http://" + ip + ":" + PORT + "/api/continuity-broadcasts");
    console.log("");

    qrcode.generate(
        "http://" + ip + ":" + PORT + phoneSurface.route,
        {
            small: true
        }
    );
});
