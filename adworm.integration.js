/* ============================================================
   adWorm — LAYER 1 INTEGRATION
   CyberCrowd Layer 1 Broadcast Subsystem
   Depends on: adworm.ui.js
   Provides: perimeter binding, mount points, position mapping
   No animation. No CSS. No styling.
   ============================================================ */

import { createAdWormUI } from "./adworm.ui.js";
import { ADWORM_PATH } from "./adworm.foundation.js";

/* ============================================================
   DEFAULT MOUNT POINT RESOLVER
   ============================================================ */

function resolveMountPoint(positionId) {
  return document.querySelector(`[data-adworm-slot="${positionId}"]`);
}

/* ============================================================
   INTEGRATION CLASS
   ============================================================ */

export class AdWormIntegration {
  constructor(id, config = {}) {
    this.id = id;
    this.ui = createAdWormUI(id, config);

    this.currentPosition = null;
    this.interval = null;

    this.startPositionMonitor();
  }

  /* ------------------------------------------------------------
     Monitor engine state → move UI element to correct slot
     ------------------------------------------------------------ */
  startPositionMonitor() {
    this.interval = setInterval(() => {
      const node = this.ui.current();
      if (!node) return;

      if (node.id !== this.currentPosition) {
        this.currentPosition = node.id;
        this.moveToPosition(node.id);
      }
    }, 50);
  }

  /* ------------------------------------------------------------
     Move UI element to the correct perimeter slot
     ------------------------------------------------------------ */
  moveToPosition(positionId) {
    const mountPoint = resolveMountPoint(positionId);
    if (!mountPoint) return;

    mountPoint.appendChild(this.ui.element);
  }

  /* ------------------------------------------------------------
     Public: start/stop/destroy
     ------------------------------------------------------------ */
  start() {
    this.ui.start();
  }

  stop() {
    this.ui.stop();
  }

  destroy() {
    clearInterval(this.interval);
    this.ui.destroy();
  }
}

/* ============================================================
   FACTORY FUNCTION
   ============================================================ */

export function createAdWormIntegration(id, config = {}) {
  return new AdWormIntegration(id, config);
}
