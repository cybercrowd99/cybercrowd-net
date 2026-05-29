import { captureSurfaceSnapshot } from "../surfaces/surface-detection.js";

function applyLayoutClass(formFactor) {
  const body = document.body;
  body.classList.remove("cc-mobile", "cc-tablet", "cc-desktop");

  if (formFactor === "mobile") body.classList.add("cc-mobile");
  else if (formFactor === "tablet") body.classList.add("cc-tablet");
  else if (formFactor === "desktop") body.classList.add("cc-desktop");
}

export function initResponsiveLayoutSwitcher() {
  const update = () => {
    const snapshot = captureSurfaceSnapshot();
    applyLayoutClass(snapshot.formFactor);
  };

  update();
  window.addEventListener("resize", update);
}
