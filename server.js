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
                "
