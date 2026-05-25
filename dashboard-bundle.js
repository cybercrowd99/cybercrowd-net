import { initDashboardCore } from "./dashboard.js";
import { initDashboardDrag } from "./dashboard-drag.js";
import { initDashboardDock } from "./dashboard-dock.js";
import { initDashboardControls } from "./dashboard-controls.js";
import { initDashboardActions } from "./dashboard-actions.js";
import { initDashboardOperator } from "./dashboard-operator.js";
import { initDashboardAdmin } from "./dashboard-admin.js";
import { initDashboardIntegrations } from "./dashboard-integrations.js";
import { initDashboardRuntime } from "./dashboard-runtime.js";
import { initCoreItems } from "./dashboard-core-items.js";
import { initMemberItems } from "./dashboard-member-items.js";
import { initCreatorItems } from "./dashboard-creator-items.js";

export function initDashboardBundle() {
    initDashboardCore();
    initDashboardDrag();
    initDashboardDock();
    initDashboardControls();
    initDashboardActions();
    initDashboardOperator();
    initDashboardAdmin();
    initDashboardIntegrations();
    initDashboardRuntime();

    initCoreItems();
    initMemberItems();
    initCreatorItems();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDashboardBundle);
} else {
    initDashboardBundle();
}
