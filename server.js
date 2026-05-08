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

/* ------------------------------------------------ */
/* LOAD CONFIG                                      */
/* ------------------------------------------------ */

loadConfig();

const config =
getConfig();

/* ------------------------------------------------ */
/* LOAD CURSOR PREFERENCES                          */
/* ------------------------------------------------ */

loadCursorPreferences();

const defaultCursor =
getDefaultCursorProfile();

/* ------------------------------------------------ */
/* LOAD SURFACE REGISTRY                            */
/* ------------------------------------------------ */

loadSurfaceRegistry();

const surfaceRegistry =
getSurfaceRegistry();

/* ------------------------------------------------ */
/* LOAD RETENTION SYSTEMS                           */
/* ------------------------------------------------ */

loadRetentionPolicy();

loadRetentionEventRegistry();

/* ------------------------------------------------ */
/* APPLY CONFIG TO OS AUTHORITY                     */
/* ------------------------------------------------ */

osAuthority.applyConfig(config);

/* ------------------------------------------------ */
/* START HEARTBEAT MONITOR                          */
/* ------------------------------------------------ */

startHeartbeatMonitor();

/* ------------------------------------------------ */
/* APP                                              */
/* ------------------------------------------------ */

const app =
express();

const server =
http.createServer(app);

/* ------------------------------------------------ */
/* CONFIG VALUES                                    */
/* ------------------------------------------------ */

const PORT =
config.bridge.port;

const laptopSurface =
config.surfaces.laptop;

const phoneSurface =
config.surfaces.phone;

/* ------------------------------------------------ */
/* NETWORK                                          */
/* ------------------------------------------------ */

function getLocalIP() {

    const nets =
    os.networkInterfaces();

    for (
        const name of Object.keys(nets)
    ) {

        for (
            const net of nets[name]
        ) {

            if (
                net.family === "IPv4" &&
                !net.internal
            ) {

                return net.address;
            }
        }
    }

    return "localhost";
}

/* ------------------------------------------------ */
/* TRANSPORT                                        */
/* ------------------------------------------------ */

const transport =
createTransport(server);

/* ------------------------------------------------ */
/* NODE BRIDGE                                      */
/* ------------------------------------------------ */

const nodeBridge =
createNodeBridge({
    transport,
    osAuthority,
    config
});

/* ------------------------------------------------ */
/* TRANSPORT EVENTS                                 */
/* ------------------------------------------------ */

transport.onMessage((data) => {

    if (
        data.type === "heartbeat" &&
        data.surfaceId
    ) {

        registerHeartbeat(
            data.surfaceId
        );

        return;
    }

    nodeBridge.handleMessage(data);
});

/* ------------------------------------------------ */
/* STATIC FILES                                     */
/* ------------------------------------------------ */

app.use(express.static(__dirname));

/* ------------------------------------------------ */
/* LAPTOP SURFACE                                   */
/* ------------------------------------------------ */

if (
    laptopSurface.enabled
) {

    app.get(
        laptopSurface.route,
        (req, res) => {

            registerHeartbeat(
                "laptop"
            );

            res.sendFile(
                path.join(
                    __dirname,
                    laptopSurface.file
                )
            );
        }
    );
}

/* ------------------------------------------------ */
/* PHONE SURFACE                                    */
/* ------------------------------------------------ */

if (
    phoneSurface.enabled
) {

    app.get(
        phoneSurface.route,
        (req, res) => {

            registerHeartbeat(
                "phone"
            );

            res.sendFile(
                path.join(
                    __dirname,
                    phoneSurface.file
                )
            );
        }
    );
}

/* ------------------------------------------------ */
/* CURSOR PROFILE API                               */
/* ------------------------------------------------ */

app.get("/api/cursor-profile", (req, res) => {

    res.json({
        success: true,
        profile: defaultCursor
    });
});

/* ------------------------------------------------ */
/* SURFACE REGISTRY API                             */
/* ------------------------------------------------ */

app.get("/api/surface-registry", (req, res) => {

    res.json({
        success: true,
        registry: surfaceRegistry
    });
});

/* ------------------------------------------------ */
/* TABLETOP STATUS API                              */
/* ------------------------------------------------ */

app.get("/api/tabletop-status", (req, res) => {

    res.json({
        success: true,

        tabletop_enabled:
            isTabletopTrialEnabled(),

        current_owner:
            getCurrentOwner(),

        surfaces:
            surfaceRegistry.surfaces,

        heartbeat:
            getSurfaceState()
    });
});

/* ------------------------------------------------ */
/* RETENTION EVENT APIs                             */
/* ------------------------------------------------ */

app.get(
    "/api/retention-events",
    (req, res) => {

        res.json({
            success: true,
            events:
                getSimulatedEvents()
        });
    }
);

app.get(
    "/api/retention-events/simulate/:eventType",
    (req, res) => {

        const result =
        createSimulatedEvent(
            req.params.eventType,
            {
                source:
                "tabletop-simulation"
            }
        );

        res.json(result);
    }
);

app.get(
    "/api/retention-events/clear",
    (req, res) => {

        const result =
        clearSimulatedEvents();

        res.json(result);
    }
);

/* ------------------------------------------------ */
/* START                                            */
/* ------------------------------------------------ */

const ip =
getLocalIP();

server.listen(PORT, () => {

    console.log("");

    console.log(
        config.bridge.name
    );

    console.log("");

    console.log(
        "VERSION:"
    );

    console.log(
        config.bridge.version
    );

    console.log("");

    console.log(
        "TABLETOP TRIAL:"
    );

    console.log(
        isTabletopTrialEnabled()
            ? "ENABLED"
            : "DISABLED"
    );

    console.log("");

    console.log(
        "CURRENT OWNER:"
    );

    console.log(
        getCurrentOwner()
    );

    console.log("");

    console.log(
        "DEFAULT CURSOR:"
    );

    console.log(
        defaultCursor.name
    );

    console.log("");

    console.log(
        "LAPTOP:"
    );

    console.log(
        "http://" +
        ip +
        ":" +
        PORT
    );

    console.log("");

    console.log(
        "PHONE:"
    );

    console.log(
        "http://" +
        ip +
        ":" +
        PORT +
        phoneSurface.route
    );

    console.log("");

    console.log(
        "RETENTION EVENT API:"
    );

    console.log(
        "http://" +
        ip +
        ":" +
        PORT +
        "/api/retention-events"
    );

    console.log("");

    qrcode.generate(
        "http://" +
        ip +
        ":" +
        PORT +
        phoneSurface.route,
        {
            small: true
        }
    );
});
