const fs = require("fs");
const path = require("path");

const SURFACE_REGISTRY_PATH =
path.join(
    __dirname,
    "surface-registry.json"
);

let cachedRegistry = null;

function loadSurfaceRegistry() {
    try {
        const raw =
        fs.readFileSync(
            SURFACE_REGISTRY_PATH,
            "utf8"
        );

        cachedRegistry =
        JSON.parse(raw);

        console.log(
            "SURFACE REGISTRY LOADED"
        );

        return cachedRegistry;

    } catch (err) {
        console.log(
            "SURFACE REGISTRY LOAD FAILED"
        );

        console.log(err);

        return null;
    }
}

function getSurfaceRegistry() {
    if (!cachedRegistry) {
        return loadSurfaceRegistry();
    }

    return cachedRegistry;
}

function reloadSurfaceRegistry() {
    cachedRegistry = null;
    return loadSurfaceRegistry();
}

function getSurface(surfaceId) {
    const registry = getSurfaceRegistry();

    if (
        !registry ||
        !registry.surfaces ||
        !registry.surfaces[surfaceId]
    ) {
        return null;
    }

    return registry.surfaces[surfaceId];
}

function getCurrentOwner() {
    const registry = getSurfaceRegistry();

    if (
        !registry ||
        !registry.ownership
    ) {
        return null;
    }

    return registry.ownership.current_owner;
}

function isTabletopTrialEnabled() {
    const registry = getSurfaceRegistry();

    return !!(
        registry &&
        registry.tabletop_trial &&
        registry.tabletop_trial.enabled === true
    );
}

module.exports = {
    loadSurfaceRegistry,
    getSurfaceRegistry,
    reloadSurfaceRegistry,
    getSurface,
    getCurrentOwner,
    isTabletopTrialEnabled
};
