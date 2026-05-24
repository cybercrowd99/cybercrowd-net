/* ============================================================
   adWorm — DASHBOARD THEME LOGIC
   CyberCrowd Layer 1 Broadcast Subsystem
   Handles: theme selection, validation, metadata
   No styling. No design. Pure logic.
   ============================================================ */

/* ============================================================
   THEME DEFINITIONS
   ============================================================ */

const THEMES = {
  cybercrowd: {
    id: "cybercrowd",
    label: "A — CyberCrowd",
    description: "Brass, museum-grade, signature CyberCrowd aesthetic."
  },
  dark: {
    id: "dark",
    label: "B — Dark",
    description: "Neutral dark mode theme."
  },
  light: {
    id: "light",
    label: "C — Light",
    description: "Neutral light mode theme."
  }
};

/* ============================================================
   VALIDATION
   ============================================================ */

/**
 * Validate a theme ID.
 * @param {string} themeId
 * @returns {boolean}
 */
export function isValidTheme(themeId) {
  return Object.prototype.hasOwnProperty.call(THEMES, themeId);
}

/* ============================================================
   GET THEME METADATA
   ============================================================ */

/**
 * Retrieve theme metadata.
 * @param {string} themeId
 * @returns {Object|null}
 */
export function getTheme(themeId) {
  if (!isValidTheme(themeId)) return null;
  return THEMES[themeId];
}

/* ============================================================
   APPLY THEME (stub)
   ============================================================ */

/**
 * Stub for applying a theme to the dashboard preview.
 * @param {string} themeId
 */
export function applyTheme(themeId) {
  if (!isValidTheme(themeId)) {
    console.warn("[adWorm][Themes] Invalid theme:", themeId);
    return;
  }

  console.log("[adWorm][Themes] Theme applied:", themeId);

  // Placeholder: actual styling will be implemented later.
}
