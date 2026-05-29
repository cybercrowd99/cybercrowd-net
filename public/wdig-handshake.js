import { captureSurfaceSnapshot } from "../surfaces/surface-detection.js";

export async function wdigRegisterSurface() {
  const snapshot = captureSurfaceSnapshot();

  const payload = {
    type: "browser",
    meta: {
      surface: snapshot
    }
  };

  await fetch("/wdig/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}
