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

app.get("/", (req, res) => {

res.send(`

<!DOCTYPE html>
<html lang="en">

<head>

<meta charset="UTF-8">

<meta name="viewport"
content="width=device-width, initial-scale=1.0">

<title>
CYBERCROWD SANDBOX CURSOR V2
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

    font-family: Arial, sans-serif;

    transition:
    background 0.2s ease;
}

#surface {

    position: relative;

    width: 100vw;
    height: 100vh;

    background:
    radial-gradient(
    circle at center,

    rgba(0,255,255,0.12),

    transparent 40%),

    transparent;

    touch-action: none;
}

#cursor {

    position: absolute;

    width: 26px;
    height: 26px;

    border-radius: 50%;

    border:
    2px solid #00ffff;

    box-shadow:
    0 0 10px #00ffff,
    0 0 20px #00ffff;

    pointer-events: none;

    transform:
    translate(-50%, -50%);

    left: 50%;
    top: 50%;

    transition:
    box-shadow 0.15s ease,
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

#mode {

    position: fixed;

    bottom: 15px;
    left: 15px;

    color: #00ffaa;

    font-size: 12px;

    opacity: 0.8;
}

</style>

</head>

<body>

<div id="surface">

<div id="title">
CYBERCROWD SANDBOX CURSOR V2
</div>

<div id="mode">
LIVE SURFACE LINK
</div>

<div id="cursor"></div>

</div>

<script>

const cursor =
document.getElementById(
"cursor"
);

const surface =
document.getElementById(
"surface"
);

const ws =
new WebSocket(
"ws://" + location.host
);

let role = "server";

if (
location.search.includes(
"client"
)
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

function sendCursor(x, y) {

    ws.send(

        JSON.stringify({

            type: "cursor",

            x:
            x / window.innerWidth,

            y:
            y / window.innerHeight,

            edge:
            x >=
            window.innerWidth - 8,

            source:
            role
        })
    );
}

if (role === "server") {

    document.body.addEventListener(
    "mousemove",

    (e) => {

        sendCursor(
            e.clientX,
            e.clientY
        );
    });

    document.body.addEventListener(
    "click",

    (e) => {

        ws.send(

            JSON.stringify({

                type: "click",

                source: role
            })
        );
    });
}

if (role === "client") {

    surface.addEventListener(
    "touchmove",

    (e) => {

        e.preventDefault();

        const t =
        e.touches[0];

        sendCursor(
            t.clientX,
            t.clientY
        );
    });

    surface.addEventListener(
    "touchstart",

    (e) => {

        const t =
        e.touches[0];

        sendCursor(
            t.clientX,
            t.clientY
        );

        ws.send(

            JSON.stringify({

                type: "click",

                source: role
            })
        );
    });
}

ws.onmessage = (event) => {

const data =
JSON.parse(
event.data
);

if (
data.type === "cursor"
) {

    if (
        data.edge === true
    ) {

        document.body.style.background =
        "#001a1a";

        cursor.style.boxShadow =
        "0 0 18px #00ffff, 0 0 40px #00ffff";

    } else {

        document.body.style.background =
        "#050505";

        cursor.style.boxShadow =
        "0 0 10px #00ffff, 0 0 20px #00ffff";
    }

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

if (
data.type === "click"
) {

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

wss.on(
"connection",

(ws) => {

clients.push(ws);

ws.on(
"message",

(msg) => {

for (
const client of clients
) {

if (
client !== ws &&
client.readyState ===
WebSocket.OPEN
) {

client.send(
msg.toString()
);
}
}
});

ws.on(
"close",

() => {

clients =
clients.filter(
c => c !== ws
);
});
});

const ip =
getLocalIP();

server.listen(
PORT,

() => {

console.log("");
console.log(
"CYBERCROWD SANDBOX CURSOR V2 ONLINE"
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

{
small: true
}
);

});
