const express = require("express");
const http = require("http");
const qrcode = require("qrcode-terminal");
const os = require("os");

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
/* LAPTOP SURFACE                                   */
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
Cybercrowd Modular Mouse Bridge
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
}

#stage {

    width: 100vw;
    height: 100vh;

    display: flex;

    align-items: center;
    justify-content: center;

    background:
    radial-gradient(
        circle at center,
        rgba(0,255,255,0.10),
        transparent 42%
    ),
    #050505;
}

#panel {

    width: 90%;
    max-width: 560px;

    border-radius: 24px;

    border:
    1px solid rgba(0,255,255,0.40);

    background:
    rgba(10,10,10,0.92);

    padding: 28px;

    text-align: center;

    box-shadow:
    0 0 28px rgba(0,255,255,0.18);
}

h1 {

    color: #00ffff;

    letter-spacing: 3px;
}

#status {

    margin-top: 18px;

    color: #00ffaa;

    line-height: 1.6;
}

#cursorDot {

    position: fixed;

    width: 28px;
    height: 28px;

    border-radius: 50%;

    border:
    2px solid #00ffff;

    box-shadow:
    0 0 16px #00ffff,
    0 0 32px #00ffff;

    left: 50%;
    top: 50%;

    transform:
    translate(-50%, -50%);

    pointer-events: none;
}

button {

    margin-top: 18px;

    width: 100%;

    padding: 14px;

    border: none;

    border-radius: 14px;

    background: #00ffff;

    color: black;

    font-weight: bold;

    cursor: pointer;
}

button.stop {

    background: #ff3355;

    color: white;
}

</style>
</head>

<body>

<div id="stage">

<div id="panel">

<h1>
CYBERCROWD MODULAR BRIDGE
</h1>

<div id="status">
Transport online.<br><br>
Phone surface may now control the laptop cursor.
</div>

<button onclick="armControl()">
ARM CONTROL
</button>

<button class="stop"
onclick="disarmControl()">
EMERGENCY STOP
</button>

</div>

</div>

<div id="cursorDot"></div>

<script>

const ws =
new WebSocket(
    "ws://" + location.host
);

const dot =
document.getElementById(
    "cursorDot"
);

const statusBox =
document.getElementById(
    "status"
);

function armControl() {

    ws.send(
        JSON.stringify({
            type: "arm-control"
        })
    );
}

function disarmControl() {

    ws.send(
        JSON.stringify({
            type: "disarm-control"
        })
    );
}

ws.onmessage = (event) => {

    const data =
    JSON.parse(event.data);

    if (
        data.type === "move"
    ) {

        dot.style.left =
        (
            data.x *
            window.innerWidth
        ) + "px";

        dot.style.top =
        (
            data.y *
            window.innerHeight
        ) + "px";
    }

    if (
        data.type === "click"
    ) {

        dot.style.transform =
        "translate(-50%, -50%) scale(1.8)";

        setTimeout(() => {

            dot.style.transform =
            "translate(-50%, -50%) scale(1)";

        }, 120);
    }

    if (
        data.type === "bridge-status"
    ) {

        statusBox.innerHTML =
        data.message;
    }
};

</script>

</body>
</html>

`);

});

/* ------------------------------------------------ */
/* PHONE SURFACE                                    */
/* ------------------------------------------------ */

app.get("/client", (req, res) => {

res.send(`

<!DOCTYPE html>
<html lang="en">
<head>

<meta charset="UTF-8">

<meta name="viewport"
content="width=device-width, initial-scale=1.0">

<title>
Cybercrowd Phone Surface
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

#pad {

    width: 100vw;
    height: 100vh;

    position: relative;

    background:
    radial-gradient(
        circle at center,
        rgba(0,255,255,0.14),
        transparent 44%
    ),
    #050505;
}

#title {

    position: fixed;

    top: 18px;
    left: 18px;

    color: #00ffff;

    font-size: 14px;

    letter-spacing: 2px;
}

#status {

    position: fixed;

    bottom: 18px;
    left: 18px;
    right: 18px;

    color: #00ffaa;

    font-size: 13px;

    line-height: 1.6;
}

#touchDot {

    position: absolute;

    width: 34px;
    height: 34px;

    border-radius: 50%;

    border:
    2px solid #00ffaa;

    box-shadow:
    0 0 18px #00ffaa,
    0 0 34px #00ffaa;

    left: 50%;
    top: 50%;

    transform:
    translate(-50%, -50%);

    pointer-events: none;
}

</style>
</head>

<body>

<div id="pad">

<div id="title">
PHONE SURFACE
</div>

<div id="touchDot"></div>

<div id="status">
Move finger to move laptop cursor.<br>
Tap to click.
</div>

</div>

<script>

const ws =
new WebSocket(
    "ws://" + location.host
);

const pad =
document.getElementById(
    "pad"
);

const dot =
document.getElementById(
    "touchDot"
);

const statusBox =
document.getElementById(
    "status"
);

function sendMove(touch) {

    const x =
    touch.clientX /
    window.innerWidth;

    const y =
    touch.clientY /
    window.innerHeight;

    dot.style.left =
    touch.clientX + "px";

    dot.style.top =
    touch.clientY + "px";

    ws.send(
        JSON.stringify({
            type: "move",
            x,
            y
        })
    );
}

pad.addEventListener(
    "touchstart",
    (e) => {

        e.preventDefault();

        sendMove(
            e.touches[0]
        );

    },
    {
        passive: false
    }
);

pad.addEventListener(
    "touchmove",
    (e) => {

        e.preventDefault();

        sendMove(
            e.touches[0]
        );

    },
    {
        passive: false
    }
);

pad.addEventListener(
    "touchend",
    () => {

        ws.send(
            JSON.stringify({
                type: "click"
            })
        );
    }
);

ws.onmessage = (event) => {

    const data =
    JSON.parse(event.data);

    if (
        data.type === "bridge-status"
    ) {

        statusBox.innerHTML =
        data.message;
    }
};

</script>

</body>
</html>

`);

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
