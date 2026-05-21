const WebSocket = require("ws");

function createTransport(server) {

    const wss =
    new WebSocket.Server({
        server
    });

    let clients = [];

    function addClient(ws) {

        clients.push(ws);

        ws.on("close", () => {

            clients =
            clients.filter(
                client =>
                client !== ws
            );
        });
    }

    function broadcast(data) {

        const payload =
        JSON.stringify(data);

        clients.forEach((client) => {

            if (
                client.readyState ===
                WebSocket.OPEN
            ) {

                client.send(payload);
            }
        });
    }

    function onMessage(callback) {

        wss.on(
            "connection",
            (ws) => {

                addClient(ws);

                ws.on(
                    "message",
                    (msg) => {

                        try {

                            const data =
                            JSON.parse(msg);

                            callback(
                                data,
                                ws
                            );

                        } catch (err) {

                            console.log(
                                "TRANSPORT PARSE ERROR"
                            );
                        }
                    }
                );
            }
        );
    }

    return {
        broadcast,
        onMessage
    };
}

module.exports = {
    createTransport
};