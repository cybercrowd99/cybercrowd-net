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
    osAuthority,
    config
});

/* ------------------------------------------------ */
/* TRAN
