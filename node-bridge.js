function createNodeBridge(options) {
    const transport = options.transport;
    const osAuthority = options.osAuthority;

    let controlArmed = true;

    function armControl() {
        controlArmed = true;

        transport.broadcast({
            type: "bridge-status",
            armed: true,
            message: "CONTROL ARMED"
        });
    }

    function disarmControl() {
        controlArmed = false;

        transport.broadcast({
            type: "bridge-status",
            armed: false,
            message: "CONTROL DISARMED"
        });
    }

    function handleMessage(data) {
        if (data.type === "arm-control") {
            armControl();
            return;
        }

        if (data.type === "disarm-control") {
            disarmControl();
            return;
        }

        if (data.type === "move") {
            if (!controlArmed) {
                return;
            }

            osAuthority.moveMouseByRatio(
                data.x,
                data.y
            );

            transport.broadcast(data);
            return;
        }

        if (data.type === "click") {
            if (!controlArmed) {
                return;
            }

            osAuthority.clickMouse();

            transport.broadcast(data);
            return;
        }

        transport.broadcast({
            type: "bridge-status",
            armed: controlArmed,
            message: "UNKNOWN EVENT IGNORED"
        });
    }

    return {
        handleMessage,
        armControl,
        disarmControl
    };
}

module.exports = {
    createNodeBridge
};
