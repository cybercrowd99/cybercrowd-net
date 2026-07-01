// src/net-surface.ts
//
// CyberCrowd Net Public Surface
//
// ONE JOB:
// Expose a safe CyberCrowd-net surface for init, reset, and snapshot.
//
// No fake paths.
// No hidden logic.
// No direct adapter loading.
// No swallowing core.
// No magic loaders.

import {
  getCyberCrowdNetInitSnapshot,
  initCyberCrowdNet,
  resetCyberCrowdNetInit
} from "./net-init";

export const CyberCrowdNetPublicSurface = {
  init() {
    return initCyberCrowdNet();
  },

  reset() {
    return resetCyberCrowdNetInit();
  },

  snapshot() {
    return getCyberCrowdNetInitSnapshot();
  }
};

export function createCyberCrowdNetSurface() {
  return CyberCrowdNetPublicSurface;
}
