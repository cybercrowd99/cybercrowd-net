import { captureSurfaceSnapshot } from "../surfaces/surface-detection.js";

function getFormFactor() {
  return captureSurfaceSnapshot().formFactor;
}

/* VAULT ---------------------------------------------------- */
function initVaultBehavior(formFactor) {
  const hero = document.querySelector(".vault-hero");
  if (!hero) return;

  if (formFactor === "mobile") {
    hero.style.transition = "opacity 0.3s ease";
    hero.addEventListener("click", () => {
      hero.style.opacity = hero.style.opacity === "0.6" ? "1" : "0.6";
    });
  }

  if (formFactor === "desktop") {
    hero.style.transition = "transform 0.25s ease";
    hero.addEventListener("mouseenter", () => {
      hero.style.transform = "scale(1.02)";
    });
    hero.addEventListener("mouseleave", () => {
      hero.style.transform = "scale(1)";
    });
  }
}

/* DASHBOARD ------------------------------------------------ */
function initDashboardBehavior(formFactor) {
  const panels = document.querySelectorAll(".dashboard-panel");
  if (!panels.length) return;

  if (formFactor === "tablet") {
    panels.forEach((p) => {
      p.addEventListener("click", () => {
        p.classList.toggle("expanded");
      });
    });
  }

  if (formFactor === "desktop") {
    panels.forEach((p) => {
      p.addEventListener("mouseenter", () => p.classList.add("hover"));
      p.addEventListener("mouseleave", () => p.classList.remove("hover"));
    });
  }
}

/* PANELS --------------------------------------------------- */
function initPanelBehavior(formFactor) {
  const panels = document.querySelectorAll(".panel");
  if (!panels.length) return;

  if (formFactor === "mobile") {
    panels.forEach((p) => {
      p.addEventListener("click", () => {
        p.classList.toggle("open");
      });
    });
  }
}

/* FEED ----------------------------------------------------- */
function initFeedBehavior(formFactor) {
  const feed = document.querySelector(".feed");
  if (!feed) return;

  if (formFactor === "mobile") {
    feed.dataset.refreshInterval = "8000";
  }

  if (formFactor === "tablet") {
    feed.dataset.refreshInterval = "5000";
  }

  if (formFactor === "desktop") {
    feed.dataset.refreshInterval = "3000";
  }
}

/* MASTER --------------------------------------------------- */
export function initComponentResponsiveScripts() {
  const formFactor = getFormFactor();

  initVaultBehavior(formFactor);
  initDashboardBehavior(formFactor);
  initPanelBehavior(formFactor);
  initFeedBehavior(formFactor);
}
