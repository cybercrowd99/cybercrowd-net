const fs = require("fs");
const path = require("path");

const EVENT_TYPES_PATH =
path.join(
    __dirname,
    "retention-event-types.json"
);

let cachedEventRegistry = null;

function loadRetentionEventRegistry() {

    try {

        const raw =
        fs.readFileSync(
            EVENT_TYPES_PATH,
            "utf8"
        );

        cachedEventRegistry =
        JSON.parse(raw);

        console.log(
            "RETENTION EVENT REGISTRY LOADED"
        );

        return cachedEventRegistry;

    } catch (err) {

        console.log(
            "RETENTION EVENT REGISTRY LOAD FAILED"
        );

        console.log(err);

        return null;
    }
}

function getRetentionEventRegistry() {

    if (!cachedEventRegistry) {

        return loadRetentionEventRegistry();
    }

    return cachedEventRegistry;
}

function reloadRetentionEventRegistry() {

    cachedEventRegistry = null;

    return loadRetentionEventRegistry();
}

function getEventType(eventType) {

    const registry =
    getRetentionEventRegistry();

    if (
        !registry ||
        !registry.event_types
    ) {

        return null;
    }

    return registry.event_types[eventType] || null;
}

function isEventRetainable(eventType) {

    const eventDefinition =
    getEventType(eventType);

    if (!eventDefinition) {

        return false;
    }

    return !!(
        eventDefinition.retainable
    );
}

function getEventCategory(eventType) {

    const eventDefinition =
    getEventType(eventType);

    if (!eventDefinition) {

        return "unknown";
    }

    return eventDefinition.category;
}

module.exports = {
    loadRetentionEventRegistry,
    getRetentionEventRegistry,
    reloadRetentionEventRegistry,
    getEventType,
    isEventRetainable,
    getEventCategory
};
