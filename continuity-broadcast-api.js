const broadcasts = [];

function createBroadcast({
    severity = "INFO",
    message = "",
    source = "continuity-system"
}) {

    const broadcast = {

        id:
        "broadcast_" +
        Date.now() +
        "_" +
        Math.floor(
            Math.random() * 10000
        ),

        severity:
        severity.toUpperCase(),

        message,

        source,

        timestamp:
        new Date().toISOString()
    };

    broadcasts.unshift(
        broadcast
    );

    console.log(
        "CONTINUITY BROADCAST:",
        broadcast.severity,
        broadcast.message
    );

    return {
        success: true,
        broadcast
    };
}

function getBroadcasts() {

    return broadcasts;
}

function clearBroadcasts() {

    broadcasts.length = 0;

    console.log(
        "CONTINUITY BROADCASTS CLEARED"
    );

    return {
        success: true
    };
}

module.exports = {
    createBroadcast,
    getBroadcasts,
    clearBroadcasts
};