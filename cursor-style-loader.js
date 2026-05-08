const fs = require("fs");
const path = require("path");

const CURSOR_PREFS_PATH =
path.join(
    __dirname,
    "cursor-preferences.json"
);

let cachedPreferences = null;

function loadCursorPreferences() {
    try {
        const raw =
        fs.readFileSync(
            CURSOR_PREFS_PATH,
            "utf8"
        );

        cachedPreferences =
        JSON.parse(raw);

        console.log(
            "CURSOR PREFERENCES LOADED"
        );

        return cachedPreferences;

    } catch (err) {
        console.log(
            "CURSOR PREFERENCES LOAD FAILED"
        );

        console.log(err);

        return null;
    }
}

function getCursorPreferences() {
    if (!cachedPreferences) {
        return loadCursorPreferences();
    }

    return cachedPreferences;
}

function getDefaultCursorProfile() {
    const preferences =
    getCursorPreferences();

    if (!preferences) {
        return null;
    }

    const profileName =
    preferences.default_profile;

    return {
        name: profileName,
        profile: preferences.profiles[profileName]
    };
}

module.exports = {
    loadCursorPreferences,
    getCursorPreferences,
    getDefaultCursorProfile
};
