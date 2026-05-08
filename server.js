const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const qrcode = require("qrcode-terminal");
const os = require("os");
const fs = require("fs");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = 7070;

/* ------------------------------------------------ */
/* LOAD ENVIRONMENT STATE                           */
/* ------------------------------------------------ */

const STATE_PATH =
path.join(
    __dirname,
    "environment-state.json"
);

let sandboxState =
JSON.parse(
    fs.readFileSync(
        STATE_PATH,
        "utf8"
    )
);

console.log("");
console.log(
    "ENVIRONMENT STATE LOADED"
);
console.log("");

/* ------------------------------------------------ */
/* LOCAL IP                                         */
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
/* SAVE STATE                                       */
/* ------------------------------------------------ */

function saveEnvironmentState() {

    fs.writeFileSync(
        STATE_PATH,
        JSON.stringify(
            sandboxState,
            null,
            2
        )
    );

    console.log(
        "ENVIRONMENT STATE SAVED"
    );
}

/* ------------------------------------------------ */
/* MAIN PAGE                                        */
/* ------------------------------------------------ */

app.get("/", (req, res) => {

res.send(`

<!DOCTYPE html>
<html lang="en">
<head>

<meta charset="UTF-8">

<meta name="viewport"
content="width=device-width, initial-scale=1.0">

<title>
Cybercrowd Magic Cursor V7
</title>

<style>

html,
body {
    margin: 0;
    padding: 0;

    width: 100%;
    height: 100%;

    overflow: hidden;

    background: #050505;

    color: white;

    font-family: Arial, sans-serif;

    touch-action: none;
}

#sandbox {
    position: relative;

    width: 100vw;
    height: 100vh;

    background:
    radial-gradient(
        circle at center,
        rgba(0,255,255,0.10),
        transparent 42%
    ),
    #050505;
}

#title {
    position: fixed;

    top: 14px;
    left: 16px;

    color: #00ffff;

    font-size: 14px;

    letter-spacing: 2px;

    z-index: 100;
}

#status {
    position: fixed;

    bottom: 16px;
    left: 16px;

    color: #00ffaa;

    font-size: 13px;

    z-index: 100;
}

#ownerBox {
    position: fixed;

    top: 14px;
    right: 16px;

    color: white;

    opacity: 0.85;

    font-size: 12px;

    text-align: right;

    z-index: 100;
}

#hint {
    position: fixed;

    bottom: 16px;
    right: 16px;

    opacity: 0.68;

    font-size: 12px;

    text-align: right;

    z-index: 100;
}

#serverSurface,
#clientSurface {

    position: absolute;

    top: 72px;
    bottom: 72px;

    border-radius: 24px;

    border:
    2px solid rgba(0,255,255,0.24);

    background:
    linear-gradient(
        145deg,
        rgba(0,255,255,0.08),
        rgba(255,255,255,0.02)
    );

    overflow: hidden;

    transition:
    border 0.18s ease,
    box-shadow 0.18s ease;
}

#serverSurface {

    left: 28px;

    width:
    calc(100vw - 56px);
}

#clientSurface {

    right: -280px;

    width: 220px;

    transition:
    right 0.35s ease,
    border 0.18s ease,
    box-shadow 0.18s ease;
}

#clientSurface.pulled {

    right: 34px;

    border:
    2px solid rgba(0,255,170,0.85);

    box-shadow:
    0 0 24px rgba(0,255,255,0.22),
    0 0 44px rgba(0,255,170,0.18);
}

.surfaceLabel {

    position: absolute;

    top: 14px;

    width: 100%;

    text-align: center;

    color: #00ffaa;

    font-size: 12px;
