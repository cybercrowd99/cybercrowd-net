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

<title>CYBERCROWD SANDBOX CURSOR</title>

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
}

#surface {

    position: relative;

    width: 100vw;
    height: 100vh;

    background:
    radial-gradient(circle at center,
    rgba(0,255,255,0.12),
    transparent 40%),

    #050505;
}

#cursor {

    position: absolute;

    width: 26px;
    height: 26px;

    border-radius: 50%;

    border: 2px solid #00ffff;

    box-shadow:
    0 0 10px #00ffff,
    0 0 20px #00ffff;

    pointer-events: none;

    transform: translate(-50%, -50%);

    left: 50%;
    top: 50%;
}

#title {

    position: fixed;

    top: 15px;
    left: 15px;

    color: #00ffff;

    font-size: 14px;

    letter-spacing: 2px;
}

</style>

</head>

<body>

<div id="surface">

<div id="title">
CYBERCROWD SANDBOX CURSOR V0
</div>

<div id="cursor"></div>

</div>

<script>

const cursor = document.getElementById("cursor");

const ws =
new WebSocket(
"ws://" + location.host
);

let role = "server";

if (
location.search.includes("client")
) {
    role = "client";
}

ws.onopen = () => {

    ws.send(
        JSON.stringify({
            type: "role",
            role: role
        })
    );
};

if (role === "server") {

    document.body.addEventListener(
    "mousemove",

    (e) => {

        ws.send(
            JSON.stringify({

                type: "cursor",

                x:
                e.clientX /
                window.innerWidth,

                y:
                e.clientY /
                window.innerHeight
            })
        );
    });

    document.body.addEventListener(
    "click",

    (e) => {

        ws.send(
            JSON.stringify({

                type: "click",

                x:
                e.clientX /
                window.innerWidth,

                y:
                e.clientY /
                window.innerHeight
            })
        );
    });
}

ws.onmessage = (event) => {

    const data =
    JSON.parse(event.data);

    if (data.type === "cursor") {

        cursor.style.left =
        (
            data.x *
            window.innerWidth
        ) + "px";

        cursor.style.top =
        (
            data.y *
            window.innerHeight
        ) + "px";
    }

    if (data.type === "click") {

        cursor.style.transform =
        "translate(-50%, -50%) scale(1.7)";

        setTimeout(() => {

            cursor.style.transform =
            "translate(-50%, -50%) scale(1)";

        }, 120);
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

                client.send(
                    msg.toString()
                );
            }
        }
    });

    ws.on("close", () => {

        clients =
        clients.filter(
            c => c !== ws
        );
    });
});

const ip = getLocalIP();

server.listen(PORT, () => {

    console.log("");
    console.log("CYBERCROWD SANDBOX CURSOR ONLINE");
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
});
