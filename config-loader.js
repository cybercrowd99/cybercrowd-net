const fs = require("fs");
const path = require("path");

const CONFIG_PATH =
path.join(
    __dirname,
    "bridge-config.json"
);

let cachedConfig = null;

function loadConfig() {

    try {

        const raw =
        fs.readFileSync(
            CONFIG_PATH,
            "utf8"
        );

        cachedConfig =
        JSON.parse(raw);

        console.log(
            "CONFIG LOADED"
        );

        return cachedConfig;

    } catch (err) {

        console.log(
            "CONFIG LOAD FAILED"
        );

        console.log(err);

        return null;
    }
}

function getConfig() {

    if (!cachedConfig) {

        return loadConfig();
    }

    return cachedConfig;
}

function reloadConfig() {

    cachedConfig = null;

    return loadConfig();
}

module.exports = {
    loadConfig,
    getConfig,
    reloadConfig
};