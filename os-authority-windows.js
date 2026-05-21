const { execFile } = require("child_process");

let screenWidth = 1920;
let screenHeight = 1080;

let throttleMs = 25;
let smoothFactor = 0.18;
let edgePadding = 2;

let lastMoveTime = 0;

let currentX = 0.5;
let currentY = 0.5;

function applyConfig(config) {

    if (
        config &&
        config.movement
    ) {

        throttleMs =
            config.movement.throttle_ms ??
            throttleMs;

        smoothFactor =
            config.movement.smooth_factor ??
            smoothFactor;

        edgePadding =
            config.movement.edge_padding ??
            edgePadding;
    }
}

function setScreenSize(width, height) {

    screenWidth =
    width || screenWidth;

    screenHeight =
    height || screenHeight;
}

function smoothValue(current, target, factor) {

    return (
        current +
        (target - current) * factor
    );
}

function moveMouseByRatio(xRatio, yRatio) {

    const now =
    Date.now();

    if (
        now - lastMoveTime <
        throttleMs
    ) {

        return;
    }

    lastMoveTime = now;

    currentX =
    smoothValue(
        currentX,
        xRatio,
        smoothFactor
    );

    currentY =
    smoothValue(
        currentY,
        yRatio,
        smoothFactor
    );

    const x =
    Math.max(
        edgePadding,
        Math.min(
            screenWidth - edgePadding,
            Math.round(
                currentX *
                screenWidth
            )
        )
    );

    const y =
    Math.max(
        edgePadding,
        Math.min(
            screenHeight - edgePadding,
            Math.round(
                currentY *
                screenHeight
            )
        )
    );

    const script =
        "Add-Type -AssemblyName System.Windows.Forms;" +
        "[System.Windows.Forms.Cursor]::Position = " +
        "New-Object System.Drawing.Point(" +
        x +
        "," +
        y +
        ")";

    execFile(
        "powershell.exe",
        [
            "-NoProfile",
            "-ExecutionPolicy",
            "Bypass",
            "-Command",
            script
        ],
        () => {}
    );
}

function clickMouse() {

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
        "[Mouse]::mouse_event(0x0004,0,0,0,0)";

    execFile(
        "powershell.exe",
        [
            "-NoProfile",
            "-ExecutionPolicy",
            "Bypass",
            "-Command",
            script
        ],
        () => {}
    );
}

module.exports = {
    applyConfig,
    setScreenSize,
    moveMouseByRatio,
    clickMouse
};