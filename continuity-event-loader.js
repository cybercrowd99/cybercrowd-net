const fs = require("fs");
const path = require("path");

const CONTINUITY_EVENT_TYPES_PATH =
path.join(
    __dirname,
    "continuity-event-types.json"
);

let cachedContinuityEventRegistry = null;

function loadContinuityEventRegistry() {

    try {

        const raw =
        fs.readFileSync(
            CONTINUITY_EVENT_TYPES_PATH,
            "utf8"
        );

        cachedContinuityEventRegistry =
        JSON.parse(raw);

        console.log(
            "CONTINUITY EVENT REGISTRY LOADED"
        );

        return cachedContinuityEventRegistry;

    } catch (err) {

        console.log(
            "CONTINUITY EVENT REGISTRY LOAD FAILED"
        );

        console.log(err);

        return null;
    }
}

function getContinuityEventRegistry() {

    if (!cachedContinuityEventRegistry) {

        return loadContinuityEventRegistry();
    }

    return cachedContinuityEventRegistry;
}

function reloadContinuityEventRegistry() {

    cachedContinuityEventRegistry = null;

    return loadContinuityEventRegistry();
}

function getContinuityEventType(eventType) {

    const registry =
    getContinuityEventRegistry();

    if (
        !registry ||
        !registry.continuity_event_types
    ) {

        return null;
    }

    return (
        registry.continuity_event_types[
            eventType
        ] || null
    );
}

function isContinuityEventRetainable(eventType) {

    const definition =
    getContinuityEventType(
        eventType
    );

    if (!definition) {

        return false;
    }

    return !!definition.retainable;
}

function getContinuityEventSeverity(eventType) {

    const definition =
    getContinuityEventType(
        eventType
    );

    if (!definition) {

        return "unknown";
    }

    return definition.severity;
}

function getContinuityEventCategory(eventType) {

    const definition =
    getContinuityEventType(
        eventType
    );

    if (!definition) {

        return "unknown";
    }

    return definition.category;
}

module.exports = {
    loadContinuityEventRegistry,
    getContinuityEventRegistry,
    reloadContinuityEventRegistry,
    getContinuityEventType,
    isContinuityEventRetainable,
    getContinuityEventSeverity,
    getContinuityEventCategory
};
