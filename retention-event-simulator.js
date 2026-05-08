const {
    isEventRetainable,
    getEventCategory,
    getEventType
} = require("./retention-event-loader");

const simulatedEvents = [];

function createSimulatedEvent(eventType, details = {}) {

    const definition =
    getEventType(eventType);

    if (!definition) {

        return {
            success: false,
            error: "UNKNOWN_EVENT_TYPE"
        };
    }

    if (
        !isEventRetainable(eventType)
    ) {

        return {
            success: false,
            error: "EVENT_NOT_RETAINABLE"
        };
    }

    const eventRecord = {

        id:
        "evt_" +
        Date.now() +
        "_" +
        Math.floor(
            Math.random() * 10000
        ),

        type:
        eventType,

        category:
        getEventCategory(
            eventType
        ),

        description:
        definition.description,

        timestamp:
        new Date().toISOString(),

        details
    };

    simulatedEvents.push(
        eventRecord
    );

    console.log(
        "SIMULATED EVENT:",
        eventType
    );

    return {
        success: true,
        event: eventRecord
    };
}

function getSimulatedEvents() {

    return simulatedEvents;
}

function clearSimulatedEvents() {

    simulatedEvents.length = 0;

    console.log(
        "SIMULATED EVENTS CLEARED"
    );

    return {
        success: true
    };
}

module.exports = {
    createSimulatedEvent,
    getSimulatedEvents,
    clearSimulatedEvents
};
