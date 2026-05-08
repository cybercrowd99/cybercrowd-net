const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const qrcode = require("qrcode-terminal");
const os = require("os");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = 7070;

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

app.get("/", (req, res) => {

res.send(`

<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title>Cybercrowd Magic Cursor V4</title>

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
    radial-gradient(circle at center, rgba(0,255,255,0.10), transparent 42%),
    #050505;
}

#title {
    position: fixed;
    top: 14px;
    left: 16px;
    color: #00ffff;
    font-size: 14px;
    letter-spacing: 2px;
    z-index: 10;
}

#status {
    position: fixed;
    bottom: 16px;
    left: 16px;
    color: #00ffaa;
    font-size: 13px;
    z-index: 10;
}

#hint {
    position: fixed;
    bottom: 16px;
    right: 16px;
    color: white;
    opacity: 0.72;
    font-size: 12px;
    text-align: right;
    z-index: 10;
}

#cursor {
    position: absolute;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 2px solid #00ffff;
    box-shadow:
    0 0 12px #00ffff,
    0 0 26px #00ffff;
    transform: translate(-50%, -50%);
    pointer-events: none;
    left: 50%;
    top: 50%;
    z-index: 20;
}

#phoneSurface {
    position: absolute;
    width: 190px;
    height: 330px;
    right: -230px;
    top: 50%;
    transform: translateY(-50%);
    border-radius: 28px;
    border: 2px solid rgba(0,255,255,0.55);
    background:
    linear-gradient(145deg, rgba(0,255,255,0.13), rgba(255,255,255,0.03));
    box-shadow: 0 0 26px rgba(0,255,255,0.20);
    transition:
    right 0.35s ease,
    box-shadow 0.25s ease,
    border 0.25s ease;
    z-index: 5;
}

#phoneSurface.pulled {
    right: 42px;
    border: 2px solid rgba(0,255,170,0.9);
    box-shadow:
    0 0 22px rgba(0,255,255,0.32),
    0 0 44px rgba(0,255,170,0.22);
}

#phoneSurface::before {
    content: "PHONE SURFACE";
    position: absolute;
    top: 18px;
    left: 0;
    width: 100%;
    text-align: center;
    color: #00ffaa;
    font-size: 12px;
    letter-spacing: 2px;
}

#phoneDot {
    position: absolute;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: #00ffaa;
    box-shadow: 0 0 18px #00ffaa;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
}

#pullZone {
    position: absolute;
    right: 0;
    top: 0;
    width: 42px;
    height: 100%;
    background: rgba(0,255,255,0.05);
    border-left: 1px solid rgba(0,255,255,0.22);
    z-index: 2;
}

#pullZone.active {
    background: rgba(0,255,255,0.16);
}

.inactive #cursor {
    opacity: 0.28;
}
</style>
</head>

<body>

<div id="sandbox">

<div id="title">CYBERCROWD MAGIC CURSOR V4</div>

<div id="pullZone"></div>

<div id="phoneSurface">
    <div id="phoneDot"></div>
</div>

<div id="cursor"></div>

<div id="status">CONNECTING...</div>

<div id="hint">
LAPTOP RIGHT EDGE = PULL PHONE INTO SANDBOX<br>
PHONE LEFT EDGE = RETURN AUTHORITY
</div>

</div>

<script>
const cursor = document.getElementById("cursor");
const statusBox = document.getElementById("status");
const pullZone = document.getElementById("pullZone");
const phoneSurface = document.getElementById("phoneSurface");
const phoneDot = document.getElementById("phoneDot");
const sandbox = document.getElementById("sandbox");

const ws = new WebSocket("ws://" + location.host);

let role = "server";

if (location.search.includes("client")) {
    role = "client";
}

let hasAuthority = role === "server";
let phonePulled = false;

function setStatus(text) {
    statusBox.textContent = text;
}

function setAuthority(value) {
    hasAuthority = value;

    if (hasAuthority) {
        document.body.classList.remove("inactive");
        setStatus(role.toUpperCase() + " HAS AUTHORITY");
    } else {
        document.body.classList.add("inactive");
        setStatus(role.toUpperCase() + " WATCHING");
    }
}

function pulse() {
    cursor.style.transform = "translate(-50%, -50%) scale(1.7)";

    setTimeout(() => {
        cursor.style.transform = "translate(-50%, -50%) scale(1)";
    }, 120);
}

function moveMainCursor(xRatio, y
