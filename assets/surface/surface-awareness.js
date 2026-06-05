/* =========================================================
   CyberCrowd Surface Awareness
   One shared device detector for CyberCrowd screens.
   Pages load this once. They do not repeat this code.
   ========================================================= */

(function () {
  const root = document.documentElement;

  function canUseDeviceMemory() {
    return typeof navigator !== "undefined" && "deviceMemory" in navigator;
  }

  function getSurfaceState() {
    return {
      isTouch:
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        navigator.msMaxTouchPoints > 0,

      isPhone: window.matchMedia("(max-width: 640px)").matches,

      isTablet: window.matchMedia(
        "(min-width: 641px) and (max-width: 1024px)"
      ).matches,

      isDesktop: window.matchMedia("(min-width: 1025px)").matches,

      isPortrait: window.matchMedia("(orientation: portrait)").matches,

      isLandscape: window.matchMedia("(orientation: landscape)").matches,

      isHighDPI: window.devicePixelRatio > 1.25,

      isLowPower: canUseDeviceMemory() && navigator.deviceMemory <= 2
    };
  }

  function setClass(name, enabled) {
    root.classList.toggle(name, Boolean(enabled));
  }

  function applySurfaceAwareness() {
    const surface = getSurfaceState();

    setClass("surface-touch", surface.isTouch);
    setClass("surface-phone", surface.isPhone);
    setClass("surface-tablet", surface.isTablet);
    setClass("surface-desktop", surface.isDesktop);
    setClass("surface-portrait", surface.isPortrait);
    setClass("surface-landscape", surface.isLandscape);
    setClass("surface-highdpi", surface.isHighDPI);
    setClass("surface-lowpower", surface.isLowPower);

    root.dataset.surface =
      surface.isPhone ? "phone" :
      surface.isTablet ? "tablet" :
      surface.isDesktop ? "desktop" :
      "unknown";

    root.dataset.orientation =
      surface.isPortrait ? "portrait" :
      surface.isLandscape ? "landscape" :
      "unknown";
  }

  function startSurfaceAwareness() {
    applySurfaceAwareness();

    let resizeTimer = null;

    window.addEventListener("resize", function () {
      window.clearTimeout(resizeTimer);

      resizeTimer = window.setTimeout(function () {
        applySurfaceAwareness();
      }, 120);
    });

    window.addEventListener("orientationchange", function () {
      window.setTimeout(applySurfaceAwareness, 180);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startSurfaceAwareness);
  } else {
    startSurfaceAwareness();
  }
})();
