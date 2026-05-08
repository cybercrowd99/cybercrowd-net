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
/* PERSISTENT SHARED SANDBOX STATE                  */
/* ------------------------------------------------ */

const sandboxState = {
    objects: [
        {
            id: "obj1",
            x: 220,
            y: 180,
            color: "#00ffff",
            label: "FLOW NODE"
        },
        {
            id: "obj2",
            x: 520,
            y: 280,
            color: "#00ffaa",
            label: "SHARED TOOL"
        }
    ],

    ownership: "server"
};

/* ------------------------------------------------ */
/* MAIN PAGE                                        */
/* ------------------------------------------------ */

app.get("/", (req, res) => {

res.send(`

<!DOCTYPE html>
<html lang="en">
<head>

<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title>Cybercrowd V5 Sandbox</title>

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

#ownership {
    position: fixed;
    top: 14px;
    right: 16px;

    color: white;
    opacity: 0.82;
    font-size: 12px;
    text-align: right;

    z-index: 100;
}

#cursor {
    position: absolute;

    width: 28px;
    height: 28px;

    border-radius: 50%;

    border: 2px solid #00ffff;

    box-shadow:
    0 0 12px #00ffff,
    0 0 24px #00ffff;

    transform: translate(-50%, -50%);

    pointer-events: none;

    left: 50%;
    top: 50%;

    z-index: 200;
}

.sandboxObject {
    position: absolute;

    width: 150px;
    height: 90px;

    border-radius: 18px;

    display: flex;
    align-items: center;
    justify-content: center;

    text-align: center;

    color: white;
    font-size: 14px;
    letter-spacing: 1px;

    user-select: none;

    cursor: grab;

    border: 2px solid rgba(255,255,255,0.12);

    box-shadow:
    0 0 20px rgba(0,255,255,0.12);

    transition:
    transform 0.12s ease,
    box-shadow 0.12s ease;
}

.sandboxObject:active {
    cursor: grabbing;
    transform: scale(1.04);
}

#edgeZone {
    position: absolute;
    top: 0;
    right: 0;

    width: 28px;
    height: 100%;

    background: rgba(0,255,255,0.04);

    border-left:
    1px solid rgba(0,255,255,0.16);

    z-index: 5;
}

#edgeZone.active {
    background:
    rgba(0,255,255,0.16);
}

#phoneSurface {
    position: absolute;

    width: 190px;
    height: 330px;

    right: -230px;
    top: 50%;

    transform: translateY(-50%);

    border-radius: 28px;

    border:
    2px solid rgba(0,255,255,0.42);

    background:
    linear-gradient(
        145deg,
        rgba(0,255,255,0.12),
        rgba(255,255,255,0.02)
    );

    box-shadow:
    0 0 24px rgba(0,255,255,0.16);

    transition:
    right 0.35s ease,
    border 0.25s ease,
    box-shadow 0.25s ease;

    z-index: 20;
}

#phoneSurface.pulled {
    right: 42px;

    border:
    2px solid rgba(0,255,170,0.82);

    box-shadow:
    0 0 28px rgba(0,255,255,0.24),
    0 0 52px rgba(0,255,170,0.18);
}

#phoneLabel {
    position: absolute;
    top: 18px;
    width: 100%;

    text-align: center;

    color: #00ffaa;
    font-size: 12px;
    letter-spacing: 2px;
}

.inactive #cursor {
    opacity: 0.24;
}

</style>
</head>

<body>

<div id="sandbox">

<div id="title">
CYBERCROWD V5
</div>

<div id="ownership">
OWNERSHIP:
<span id="ownerLabel">SERVER</span>
</div>

<div id="status">
CONNECTING...
</div>

<div id="edgeZone"></div>

<div id="phoneSurface">
    <div id="phoneLabel">
        PHONE SURFACE
    </div>
</div>

<div id="cursor"></div>

</div>

<script>

const ws =
new WebSocket(
    "ws://" + location.host
);

const sandbox =
document.getElementById("sandbox");

const cursor =
document.getElementById("cursor");

const ownerLabel =
document.getElementById("ownerLabel");

const edgeZone =
document.getElementById("edgeZone");

const phoneSurface =
document.getElementById("phoneSurface");

const statusBox =
document.getElementById("status");

let role = "server";

if (
    location.search.includes("client")
) {
    role = "client";
}

let hasOwnership =
role === "server";

let dragging = null;

function setStatus(text) {
    statusBox.textContent = text;
}

function setOwnership(value) {

    hasOwnership = value;

    if (hasOwnership) {
        document.body.classList.remove("inactive");
    } else {
        document.body.classList.add("inactive");
    }
}

function pulseCursor() {

    cursor.style.transform =
    "translate(-50%, -50%) scale(1.7)";

    setTimeout(() => {

        cursor.style.transform =
        "translate(-50%, -50%) scale(1)";

    }, 120);
}

function send(data) {

    if (
        ws.readyState === WebSocket.OPEN
    ) {
        ws.send(JSON.stringify(data));
    }
}

function moveCursor(x, y) {

    cursor.style.left = x + "px";
    cursor.style.top = y + "px";
}

function renderObjects(objects) {

    document
    .querySelectorAll(".sandboxObject")
    .forEach(el => el.remove());

    objects.forEach((obj) => {

        const div =
        document.createElement("div");

        div.className =
        "sandboxObject";

        div.dataset.id =
        obj.id;

        div.style.left =
        obj.x + "px";

        div.style.top =
        obj.y + "px";

        div.style.background =
        obj.color;

        div.textContent =
        obj.label;

        sandbox.appendChild(div);

        div.addEventListener(
            "mousedown",
            (e) => {

            if (!hasOwnership) {
                return;
            }

            dragging = obj.id;

        });

        div.addEventListener(
            "touchstart",
            (e) => {

            if (!hasOwnership) {
                return;
            }

            dragging = obj.id;

        });

    });
}

function updateOwnershipLabel(owner) {

    ownerLabel.textContent =
    owner.toUpperCase();

    if (owner === "client") {

        phoneSurface.classList.add(
            "pulled"
        );

        edgeZone.classList.add(
            "active"
        );

    } else {

        phoneSurface.classList.remove(
            "pulled"
        );

        edgeZone.classList.remove(
            "active"
        );
    }
}

function sendOwnership(target) {

    send({
        type: "ownership",
        owner: target
    });
}

function sendMove(id, x, y) {

    send({
        type: "move-object",
        id,
        x,
        y
    });
}

function sendCursorMove(x, y) {

    send({
        type: "cursor",
        x,
        y
    });
}

/* ----------------------------------------- */
/* POINTER EVENTS                            */
/* ----------------------------------------- */

document.addEventListener(
    "mousemove",
    (e) => {

    moveCursor(
        e.clientX,
        e.clientY
    );

    sendCursorMove(
        e.clientX,
        e.clientY
    );

    if (
        role === "server" &&
        hasOwnership
    ) {

        if (
            e.clientX >=
            window.innerWidth - 12
        ) {

            sendOwnership("client");

            pulseCursor();
        }
    }

    if (dragging && hasOwnership) {

        sendMove(
            dragging,
            e.clientX - 75,
            e.clientY - 45
        );
    }
});

document.addEventListener(
    "mouseup",
    () => {
    dragging = null;
});

document.addEventListener(
    "touchmove",
    (e) => {

    const t =
    e.touches[0];

    moveCursor(
        t.clientX,
        t.clientY
    );

    sendCursorMove(
        t.clientX,
        t.clientY
    );

    if (
        role === "client" &&
        hasOwnership
    ) {

        if (
            t.clientX <= 10
        ) {

            sendOwnership("server");

            pulseCursor();
        }
    }

    if (dragging && hasOwnership) {

        sendMove(
            dragging,
            t.clientX - 75,
            t.clientY - 45
        );
    }
},
{
    passive: false
});

document.addEventListener(
    "touchend",
    () => {
    dragging = null;
});

/* ----------------------------------------- */
/* SOCKET                                    */
/* ----------------------------------------- */

ws.onopen = () => {

    send({
        type: "join",
        role
    });

    setStatus(
        role.toUpperCase() +
        " CONNECTED"
    );
};

ws.onmessage = (event) => {

    const data =
    JSON.parse(event.data);

    if (
        data.type === "state"
    ) {

        renderObjects(
            data.state.objects
        );

        updateOwnershipLabel(
            data.state.ownership
        );

        setOwnership(
            data.state.ownership === role
        );
    }

    if (
        data.type === "cursor"
    ) {

        moveCursor(
            data.x,
            data.y
        );
    }

    if (
        data.type === "move-object"
    ) {

        const obj =
        document.querySelector(
            '[data-id="' +
            data.id +
            '"]'
        );

        if (obj) {

            obj.style.left =
            data.x + "px";

            obj.style.top =
            data.y + "px";
        }
    }

    if (
        data.type === "ownership"
    ) {

        updateOwnershipLabel(
            data.owner
        );

        setOwnership(
            data.owner === role
        );
    }
};

</script>

</body>
</html>

`);

});

/* ------------------------------------------------ */
/* SOCKET SERVER                                    */
/* ------------------------------------------------ */

let clients = [];

function broadcast(data) {

    const json =
    JSON.stringify(data);

    clients.forEach((client) => {

        if (
            client.readyState ===
            WebSocket.OPEN
        ) {
            client.send(json);
        }
    });
}

wss.on("connection", (ws) => {

    clients.push(ws);

    ws.send(
        JSON.stringify({
            type: "state",
            state: sandboxState
        })
    );

    ws.on("message", (msg) => {

        const data =
        JSON.parse(msg);

        if (
            data.type === "ownership"
        ) {

            sandboxState.ownership =
            data.owner;

            broadcast({
                type: "ownership",
                owner: data.owner
            });
        }

        if (
            data.type === "move-object"
        ) {

            const obj =
            sandboxState.objects.find(
                o => o.id === data.id
            );

            if (obj) {

                obj.x = data.x;
                obj.y = data.y;
            }

            broadcast(data);
        }

        if (
            data.type === "cursor"
        ) {

            broadcast(data);
        }
    });

    ws.on("close", () => {

        clients =
        clients.filter(
            c => c !== ws
        );
    });
});

/* ------------------------------------------------ */
/* START                                            */
/* ------------------------------------------------ */

const ip = getLocalIP();

server.listen(PORT, () => {

    console.log("");
    console.log(
        "CYBERCROWD V5 PERSISTENT SANDBOX ONLINE"
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
        "/?client"
    );

    console.log("");

    qrcode.generate(
        "http://" +
        ip +
        ":" +
        PORT +
        "/?client",
        { small: true }
    );
});
