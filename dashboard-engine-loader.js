/* ============================================================
   CyberCrowd Dashboard Engine Loader
   Ensures engine initializes before dashboard runtime
   ============================================================ */

console.log("[dashboard-engine-loader] starting…");

/* Try new registry engine first */
async function loadRegistryEngine() {
    try {
        await import("/surface-registry-loader.js");
        console.log("[dashboard-engine-loader] registry engine loaded");
        return true;
    } catch (e) {
        console.warn("[dashboard-engine-loader] registry engine missing");
        return false;
    }
}

/* Fallback to legacy engine */
async function loadLegacyEngine() {
    try {
        await import("/surfaces/js/surface.js");
        console.log("[dashboard-engine-loader] legacy engine loaded");
        return true;
    } catch (e) {
        console.warn("[dashboard-engine-loader] legacy engine missing");
        return false;
    }
}

/* Engine boot sequence */
(async () => {
    const registryOk = await loadRegistryEngine();
    if (!registryOk) {
        const legacyOk = await loadLegacyEngine();
        if (!legacyOk) {
            console.error("[dashboard-engine-loader] no engine available");
        }
    }
})();
