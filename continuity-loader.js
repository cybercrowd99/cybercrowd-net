const fs = require("fs");
const path = require("path");

const CONTINUITY_REGISTRY_PATH =
path.join(
    __dirname,
    "continuity-registry.json"
);

let cachedContinuityRegistry = null;

function loadContinuityRegistry() {

    try {

        const raw =
        fs.readFileSync(
            CONTINUITY_REGISTRY_PATH,
            "utf8"
        );

        cachedContinuityRegistry =
        JSON.parse(raw);

        console.log(
            "CONTINUITY REGISTRY LOADED"
        );

        return cachedContinuityRegistry;

    } catch (err) {

        console.log(
            "CONTINUITY REGISTRY LOAD FAILED"
        );

        console.log(err);

        return null;
    }
}

function getContinuityRegistry() {

    if (!cachedContinuityRegistry) {

        return loadContinuityRegistry();
    }

    return cachedContinuityRegistry;
}

function reloadContinuityRegistry() {

    cachedContinuityRegistry = null;

    return loadContinuityRegistry();
}

function getContinuityMode(modeName) {

    const registry =
    getContinuityRegistry();

    if (
        !registry ||
        !registry.continuity_modes
    ) {

        return null;
    }

    return (
        registry.continuity_modes[
            modeName
        ] || null
    );
}

function isContinuityModeEnabled(modeName) {

    const mode =
    getContinuityMode(modeName);

    if (!mode) {

        return false;
    }

    return !!mode.enabled;
}

function getContinuitySurface(surfaceName) {

    const registry =
    getContinuityRegistry();

    if (
        !registry ||
        !registry.continuity_surfaces
    ) {

        return null;
    }

    return (
        registry.continuity_surfaces[
            surfaceName
        ] || null
    );
}

module.exports = {
    loadContinuityRegistry,
    getContinuityRegistry,
    reloadContinuityRegistry,
    getContinuityMode,
    isContinuityModeEnabled,
    getContinuitySurface
};