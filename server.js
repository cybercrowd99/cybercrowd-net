const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const qrcode = require("qrcode-terminal");
const os = require("os");
const { execFile } = require("child_process");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = 7070;

let screenWidth = 1920;
let screenHeight = 1080;
let lastMoveTime = 0;

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

function moveNativeMouse(xRatio, yRatio) {
    const now = Date.now();

    if (now - lastMoveTime < 25) {
        return;
    }

    lastMoveTime = now;

    const x = Math.max(0, Math.min(screenWidth - 1, Math.round(xRatio * screenWidth)));
    const y = Math.max(0, Math.min(screenHeight - 1, Math.round(yRatio * screenHeight)));

    const script =
        "Add-Type -AssemblyName System.Windows.Forms;" +
        "[System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(" +
        x + "," + y + ");";

    execFile(
        "powershell.exe",
        ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script],
        () => {}
    );
}

function nativeClick() {
    const script =
        "Add-Type -TypeDefinition @'" +
        "using System;" +
        "using System.Runtime.InteropServices;" +
        "public class Mouse {" +
        "[DllImport(\"user32.dll\", CharSet=CharSet.Auto, CallingConvention=CallingConvention.StdCall)]" +
        "public static extern void mouse_event(long dwFlags, long dx, long dy, long cButtons, long dwExtraInfo);" +
        "}" +
        "'@;" +
        "[Mouse]::mouse_event(0x0002,0,0,0,0);" +
        "Start-Sleep -Milliseconds 40;" +
        "[Mouse]::mouse_event(0x0004,0,0,0,0);";

    execFile(
        "powershell.exe",
        ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script],
        () => {}
    );
}

app.get("/", (req, res) => {
res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Cybercrowd Native Mouse Bridge</title>

<style>
html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    background: #050505;
    color: white;
    font-family: Arial, sans-serif;
    overflow: hidden;
    touch-action: none;
}

#stage {
    width: 100vw;
    height: 100vh;
    background:
    radial-gradient(circle at center, rgba(0,255,255,0.10), transparent 42%),
    #050505;
    display: flex;
    align-items: center;
    justify-content: center;
}

#panel {
    width: 90%;
    max-width: 520px;
    border: 1px solid rgba(0,255,255,0.45);
    border-radius: 24px;
    padding: 26px;
    background: rgba(10,10,10,0.92);
    box-shadow: 0 0 28px rgba(0,255,255,0.18);
    text-align: center;
}

h1 {
    color: #00ffff;
    letter-spacing: 3px;
}

#status {
    color: #00ffaa;
    margin-top: 18px;
    line-height: 1.5;
}

#cursorDot {
    position: fixed;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    border: 2px solid #00ffff;
    box-shadow: 0 0 14px #00ffff, 0 0 28px #00ffff;
    transform: translate(-50%, -50%);
    left: 50%;
    top: 50%;
    pointer-events: none;
}
</style>
</head>

<body>

<div id="stage">
    <div id="panel">
        <h1>CYBERCROWD MOUSE BRIDGE</h1>

        <div id="status">
            Laptop receiver active.<br><br>
            Open the phone link or scan the QR from the terminal.<br><br>
            Phone touch = laptop mouse movement.
        </div>
    </div>
</div>

<div id="cursorDot"></div>

<script>
const ws = new WebSocket("ws://" + location.host);
const dot = document.getElementById("cursorDot");

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === "move") {
        dot.style.left = (data.x * window.innerWidth) + "px";
        dot.style.top = (data.y * window.innerHeight) + "px";
    }

    if (data.type === "click") {
        dot.style.transform = "translate(-50%, -50%) scale(1.8)";
        setTimeout(() => {
            dot.style.transform = "translate(-50%, -50%) scale(1)";
        }, 120);
    }
};
</script>

</body>
</html>
`);
});

app.get("/client", (req, res) => {
res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Cybercrowd Phone Touchpad</title>

<style>
html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    background: #050505;
    color: white;
    font-family: Arial, sans-serif;
    overflow: hidden;
    touch-action: none;
}

#pad {
    width: 100vw;
    height: 100vh;
    background:
    radial-gradient(circle at center, rgba(0,255,255,0.14), transparent 44%),
    #050505;
    position: relative;
}

#title {
    position: fixed;
    top: 18px;
    left: 18px;
    color: #00ffff;
    letter-spacing: 2px;
    font-size: 14px;
}

#status {
    position: fixed;
    bottom: 18px;
    left: 18px;
    right: 18px;
    color: #00ffaa;
    font-size: 13px;
    line-height: 1.5;
}

#touchDot {
    position: absolute;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    border: 2px solid #00ffaa;
    box-shadow: 0 0 18px #00ffaa, 0 0 34px #00ffaa;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
}
</style>
</head>

<body>

<div id="pad">
    <div id="title">PHONE TOUCHPAD</div>
    <div id="touchDot"></div>
    <div id="status">
        Move finger to move laptop mouse.<br>
        Tap once to click.
    </div>
</div>

<script>
const ws = new WebSocket("ws://" + location.host);
const pad = document.getElementById("pad");
const dot = document.getElementById("touchDot");

function sendMove(touch) {
    const x = touch.clientX / window.innerWidth;
    const y = touch.clientY / window.innerHeight;

    dot.style.left = touch.clientX + "px";
    dot.style.top = touch.clientY + "px";

    ws.send(JSON.stringify({
        type: "move",
        x: x,
        y: y
    }));
}

pad.addEventListener("touchmove", (e) => {
    e.preventDefault();
    sendMove(e.touches[0]);
}, { passive: false });

pad.addEventListener("touchstart", (e) => {
    e.preventDefault();
    sendMove(e.touches[0]);
}, { passive: false });

pad.addEventListener("touchend", () => {
    ws.send(JSON.stringify({
        type: "click"
    }));
});
</script>

</body>
</html>
`);
});

let clients = [];

wss.on("connection", (ws) => {
    clients.push(ws);

    ws.on("message", (msg) => {
        const data = JSON.parse(msg);

        if (data.type === "move") {
            moveNativeMouse(data.x, data.y);
        }

        if (data.type === "click") {
            nativeClick();
        }

        clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
            }
        });
    });

    ws.on("close", () => {
        clients = clients.filter(c => c !== ws);
    });
});

const ip = getLocalIP();

server.listen(PORT, () => {
    console.log("");
    console.log("CYBERCROWD NATIVE MOUSE BRIDGE ONLINE");
    console.log("");
    console.log("LAPTOP:");
    console.log("http://" + ip + ":" + PORT);
    console.log("");
    console.log("PHONE:");
    console.log("http://" + ip + ":" + PORT + "/client");
    console.log("");
    qrcode.generate("http://" + ip + ":" + PORT + "/client", { small: true });
});
