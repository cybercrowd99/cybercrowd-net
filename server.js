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

const app = express();
const server = http.createServer(app);

const PORT = 7070;

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
/* STATIC SURFACES                                  */
/* ------------------------------------------------ */

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "laptop-surface.html"
        )
    );
});

app.get("/client", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "phone-surface.html"
        )
    );
});

/* ------------------------------------------------ */
/* START                                            */
/* ------------------------------------------------ */

const ip =
getLocalIP();

server.listen(PORT, () => {

    console.log("");

    console.log(
        "CYBERCROWD MODULAR BRIDGE ONLINE"
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
        "/client"
    );

    console.log("");

    qrcode.generate(
        "http://" +
        ip +
        ":" +
        PORT +
        "/client",
        {
            small: true
        }
    );
});
