/* ============================================================
   adWorm — DEV APP INTEGRATION CONTROLLER
   CyberCrowd Layer 1 Broadcast Subsystem
   Purpose: unify dashboard modules for developer testing
   No UI. No styling. Pure internal logic.
   ============================================================ */

import { runAutoFilter } from "./adworm.dashboard.filters.js";
import { sendToRoomContent, sendToCourt } from "./adworm.dashboard.review.js";
import { apiSubmitCampaign, apiFetchRoomContent, apiFetchCourt } from "./adworm.dashboard.api.js";
import { isValidTheme, applyTheme } from "./adworm.dashboard.themes.js";
import { checkDoctrineViolation, getDoctrineSummary } from "./adworm.dashboard.security.js";

/* ============================================================
   DEV APP CONTROLLER
   ============================================================ */

export const DevApp = {
  /**
   * Simulate a full submission pipeline.
   * @param {Object} submission
   */
  async simulateSubmission(submission) {
    console.log("[DevApp] Simulating submission:", submission);

    // Doctrine check
    const doctrineViolation = checkDoctrineViolation(submission.copy || "");
    if (doctrineViolation) {
      console.warn("[DevApp] Doctrine violation detected:", doctrineViolation);
    }

    // Auto-filter
    const filterResult = await runAutoFilter(submission);
    console.log("[DevApp] Auto-filter result:", filterResult);

    // Route
    if (filterResult.pass) {
      sendToRoomContent(submission);
    } else {
      sendToCourt(submission);
    }

    // API stub
    const apiResult = await apiSubmitCampaign(submission);
    console.log("[DevApp] API stub result:", apiResult);

    return {
      doctrineViolation,
      filterResult,
      apiResult
    };
  },

  /**
   * Simulate theme switching.
   * @param {string} themeId
   */
  simulateTheme(themeId) {
    if (!isValidTheme(themeId)) {
      console.warn("[DevApp] Invalid theme:", themeId);
      return false;
    }

    applyTheme(themeId);
    console.log("[DevApp] Theme simulation complete:", themeId);
    return true;
  },

  /**
   * Fetch Room Content queue (stub).
   */
  async getRoomContent() {
    return await apiFetchRoomContent();
  },

  /**
   * Fetch Court queue (stub).
   */
  async getCourtQueue() {
    return await apiFetchCourt();
  },

  /**
   * Get doctrine summary.
   */
  getDoctrine() {
    return getDoctrineSummary();
  }
};

/* ============================================================
   DEV APP READY
   ============================================================ */

console.log("[adWorm DevApp] Integration controller loaded.");
