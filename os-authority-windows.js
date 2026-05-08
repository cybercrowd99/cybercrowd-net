const { execFile } = require("child_process");

let screenWidth = 1920;
let screenHeight = 1080;
let lastMoveTime = 0;

function setScreenSize(width, height) {
    screenWidth = width || screenWidth;
    screenHeight = height || screenHeight;
}

function moveMouseByRatio(xRatio, yRatio) {
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
        "[Mouse]::mouse_event(0x0004,0,0,0,0);";

    execFile(
        "powershell.exe",
        ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script],
        () => {}
    );
}

module.exports = {
    setScreenSize,
    moveMouseByRatio,
    clickMouse
};
