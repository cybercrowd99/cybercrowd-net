FULL_DROP:
"use strict";

export class IsolationGuard {
    constructor() {
        this.locked = true;
        this.auditLog = [];
    }

    validateDecoyRequest(req) {
        const allowed = req?.context === "decoy-surface";
        this.auditLog.push({
            ts: Date.now(),
            type: "validateDecoyRequest",
            allowed,
            source: req?.source || "unknown"
        });
        return allowed;
    }

    blockRealSurfaceAccess(req) {
        this.auditLog.push({
            ts: Date.now(),
            type: "blockRealSurfaceAccess",
            source: req?.source || "unknown"
        });
        return {
            status: "denied",
            reason: "real-surface-access-blocked"
        };
    }

    enforceDecoyRouting(targetSurface) {
        const allowed = targetSurface === "decoy-surface";
        this.auditLog.push({
            ts: Date.now(),
            type: "enforceDecoyRouting",
            targetSurface,
            allowed
        });
        return allowed ? targetSurface : "blocked-surface";
    }

    exportTelemetry() {
        return [...this.auditLog];
    }

    reset() {
        this.locked = true;
        this.auditLog.push({
            ts: Date.now(),
            type: "reset",
            note: "isolation-guard state reset"
        });
    }
}
