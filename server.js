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

<meta name="viewport"
content="width=device-width, initial-scale=1.0">

<title>CYBERCROWD MAGIC CURSOR V3</title>

<style>

html,
body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #050505;
    font-family: Arial, sans-serif;
    touch-action: none;
}

#surface {
    position: relative;
    width: 100vw;
    height: 100vh;
    background:
    radial-gradient(circle at center, rgba(0,255,255,0.12), transparent 42%),
    transparent;
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
    pointer-events: none;
    transform: translate(-50%, -50%);
    left: 50%;
    top: 50%;
    transition:
    box-shadow 0.15s ease,
    opacity 0.15s ease,
    transform 0.15s ease;
}

#title {
    position: fixed;
    top: 15px;
    left: 15px;
    color: #00ffff;
    font-size: 14px;
    letter-spacing: 2px;
}

#status {
    position: fixed;
    bottom: 15px;
    left: 15px;
    color: #00ffaa;
    font-size: 13px;
    opacity: 0.9;
}

#hint {
    position: fixed;
    bottom: 15px;
    right: 15px;
    color: #ffffff;
    font-size: 12px;
    opacity: 0.65;
    text-align: right;
}

.active {
    background: #001f1f !important;
}

.inactive #cursor {
    opacity: 0.25;
}

</style>

</head>

<body>

<div id="surface">

<div id="title">
CYBERCROWD MAGIC CURSOR V3
</div>

<div id="status">
CONNECTING...
</div>

<div id="hint">
RIGHT EDGE = SEND TO PHONE<br>
PHONE LEFT EDGE = RETURN
</div>

<div id="cursor"></div>

</div>

<script>

const cursor =
document.getElementById("cursor");

const statusBox =
document.getElementById("status");

const surface =
document.getElementById("surface");

const ws =
new WebSocket("ws://" + location.host);

let role = "server";

if (location.search.includes("client")) {
    role = "client";
}

let hasAuthority =
role === "server";

let lastX =
window.innerWidth / 2;

let lastY =
window.innerHeight / 2;

function setAuthority(value) {

    hasAuthority = value;

    if (hasAuthority) {
        document.body.classList.add("active");
        document.body.classList.remove("inactive");

        statusBox.textContent =
        role.toUpperCase() + " HAS CURSOR AUTHORITY";

    } else {
        document.body.classList.remove("active");
        document.body.classList.add("inactive");

        statusBox.textContent =
        role.toUpperCase() + " WATCHING";
    }
}

function moveCursorByRatio(xRatio, yRatio) {

    lastX =
    xRatio * window.innerWidth;

    lastY =
    yRatio * window.innerHeight;

    cursor.style.left =
    lastX + "px";

    cursor.style.top =
    lastY + "px";
}

function sendCursor(x, y) {

    ws.send(
        JSON.stringify({
            type: "cursor",
            x: x / window.innerWidth,
            y: y / window.innerHeight,
            source: role
        })
    );
}

function sendAuthority(target) {

    ws.send(
        JSON.stringify({
            type: "authority",
            target: target
        })
    );
}

function pulse() {

    cursor.style.transform =
    "translate(-50%, -50%) scale(1.7)";

    setTimeout(() => {
        cursor.style.transform =
        "translate(-50%, -50%) scale(1)";
    }, 120);
}

ws.onopen = () => {

    ws.send(
        JSON.stringify({
            type: "role",
            role: role
        })
    );

    setAuthority(hasAuthority);
};

if (role === "server") {

    document.body.addEventListener("mousemove", (e) => {

        if (!hasAuthority) {
            return;
        }

        lastX = e.clientX;
        lastY = e.clientY;

        sendCursor(lastX, lastY);

        if (e.clientX >= window.innerWidth - 8) {
            sendAuthority("client");
            setAuthority(false);
            pulse();
        }
    });

    document.body.addEventListener("click", () => {

        if (!hasAuthority) {
            return;
        }

        ws.send(
            JSON.stringify({
                type: "click",
                source: role
            })
        );
    });
}

if (role === "client") {

    surface.addEventListener("touchmove", (e) => {

        e.preventDefault();

        if (!hasAuthority) {
            return;
        }

        const t =
        e.touches[0];

        lastX = t.clientX;
        lastY = t.clientY;

        sendCursor(lastX, lastY);

        if (t.clientX <= 8) {
            sendAuthority("server");
            setAuthority(false);
            pulse();
        }
    });

    surface.addEventListener("touchstart", (e) => {

        e.preventDefault();

        if (!hasAuthority) {
            return;
        }

        const t =
        e.touches[0];

        lastX = t.clientX;
        lastY = t.clientY;

        sendCursor(lastX, lastY);

        ws.send(
            JSON.stringify({
                type: "click",
                source: role
            })
        );

        if (t.clientX <= 8) {
            sendAuthority("server");
            setAuthority(false);
            pulse();
        }
    });
}

ws.onmessage = (event) => {

    const data =
    JSON.parse(event.data);

    if (data.type === "cursor") {
        moveCursorByRatio(data.x, data.y);
    }

    if (data.type === "click") {
        pulse();
    }

    if (data.type === "authority") {

        if (data.target === role) {
            setAuthority(true);
            pulse();
        } else {
            setAuthority(false);
        }
    }
};

</script>

</body>
</html>

`);

});

let clients = [];

wss.on("connection", (ws) => {

    clients.push(ws);

    ws.on("message", (msg) => {

        for (const client of clients) {
            if (
                client !== ws &&
                client.readyState === WebSocket.OPEN
            ) {
                client.send(msg.toString());
            }
        }
    });

    ws.on("close", () => {
        clients =
        clients.filter(c => c !== ws);
    });
});

const ip =
getLocalIP();

server.listen(PORT, () => {

    console.log("");
    console.log("CYBERCROWD MAGIC CURSOR V3 ONLINE");
    console.log("");

    console.log("LAPTOP:");
    console.log("http://" + ip + ":" + PORT);

    console.log("");

    console.log("PHONE:");
    console.log("http://" + ip + ":" + PORT + "/?client");

    console.log("");

    qrcode.generate(
        "http://" + ip + ":" + PORT + "/?client",
        { small: true }
    );
});
