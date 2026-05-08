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

loadConfig();

const config =
getConfig();

loadCursorPreferences();

const defaultCursor =
getDefaultCursorProfile();

loadSurfaceRegistry();

const surfaceRegistry =
getSurfaceRegistry();

osAuthority.applyConfig(config);

const app =
express();

const server =
http.createServer(app);

const PORT =
config.bridge.port;

const laptopSurface =
config.surfaces.laptop;

const phoneSurface =
config.surfaces.phone;

function getLocalIP() {
    const nets =
    os.networkInterfaces();

    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === "IPv4" && !net.internal) {
                return net.address;
            }
        }
    }

    return "localhost";
}

const transport =
createTransport(server);

const nodeBridge =
createNodeBridge({
    transport,
    osAuthority,
    config
});

transport.onMessage((data) => {
    nodeBridge.handleMessage(data);
});

app.use(express.static(__dirname));

if (laptopSurface.enabled) {
    app.get(laptopSurface.route, (req, res) => {
        res.sendFile(
            path.join(__dirname, laptopSurface.file)
        );
    });
}

if (phoneSurface.enabled) {
    app.get(phoneSurface.route, (req, res) => {
        res.sendFile(
            path.join(__dirname, phoneSurface.file)
        );
    });
}

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
        surfaces: surfaceRegistry.surfaces
    });
});

const ip =
getLocalIP();

server.listen(PORT, () => {
    console.log("");
    console.log(config.bridge.name);
    console.log("");

    console.log("VERSION:");
    console.log(config.bridge.version);
    console.log("");

    console.log("TABLETOP TRIAL:");
    console.log(
        isTabletopTrialEnabled()
            ? "ENABLED"
            : "DISABLED"
    );
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
    console.log(
        "http://" +
        ip +
        ":" +
        PORT +
        phoneSurface.route
    );
    console.log("");

    qrcode.generate(
        "http://" +
        ip +
        ":" +
        PORT +
        phoneSurface.route,
        { small: true }
    );
});
