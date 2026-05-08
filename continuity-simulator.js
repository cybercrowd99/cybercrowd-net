const {
    getContinuityEventType,
    isContinuityEventRetainable,
    getContinuityEventSeverity,
    getContinuityEventCategory
} = require("./continuity-event-loader");

const simulatedContinuityEvents = [];

function createContinuityEvent(
    eventType,
    details = {}
) {

    const definition =
    getContinuityEventType(
        eventType
    );

    if (!definition) {

        return {
            success: false,
            error: "UNKNOWN_CONTINUITY_EVENT"
        };
    }

    if (
        !isContinuityEventRetainable(
            eventType
        )
    ) {

        return {
            success: false,
            error:
            "CONTINUITY_EVENT_NOT_RETAINABLE"
        };
    }

    const eventRecord = {

        id:
        "cont_evt_" +
        Date.now() +
        "_" +
        Math.floor(
            Math.random() * 10000
        ),

        type:
        eventType,

        category:
        getContinuityEventCategory(
            eventType
        ),

        severity:
        getContinuityEventSeverity(
            eventType
        ),

        description:
        definition.description,

        timestamp:
        new Date().toISOString(),

        details
    };

    simulatedContinuityEvents.push(
        eventRecord
    );

    console.log(
        "CONTINUITY EVENT:",
        eventType
    );

    return {
        success: true,
        event: eventRecord
    };
}

function getContinuityEvents() {

    return simulatedContinuityEvents;
}

function clearContinuityEvents() {

    simulatedContinuityEvents.length = 0;

    console.log(
        "CONTINUITY EVENTS CLEARED"
    );

    return {
        success: true
    };
}

module.exports = {
    createContinuityEvent,
    getContinuityEvents,
    clearContinuityEvents
};
