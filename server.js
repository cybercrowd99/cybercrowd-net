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
/* APPLY CONFIG TO OS AUTHORITY                     */
/* ------------------------------------------------ */

osAuthority.applyConfig(config);

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
        "CONTROL DEFAULT:"
    );

    console.log(
        config.bridge.control_armed_default
            ? "ARMED"
            : "DISARMED"
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
