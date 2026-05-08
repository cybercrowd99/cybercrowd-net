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

/* ------------------------------------------------ */
/* LOAD CONFIG                                      */
/* ------------------------------------------------ */

loadConfig();

const config =
getConfig();

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
    osAuthority
});

/* ------------------------------------------------ */
/* TRANSPORT EVENTS                                 */
/* ------------------------------------------------ */

transport.onMessage((data) => {

    nodeBridge.handleMessage(data);
});

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
