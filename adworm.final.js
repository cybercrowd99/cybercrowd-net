/* ============================================================
   adWorm — UNIFIED INTEGRATION LAYER
   CyberCrowd Layer 1 Broadcast Subsystem
   Purpose: expose a single high-level API for adWorm
   No styling. No design. No DOM creation.
   ============================================================ */

import { createAdWormComponent } from "./adworm.component.js";
import { createAdWormUI } from "./adworm.ui.js";
import { createAdWormVisuals } from "./adworm.visuals.js";

/* ============================================================
   MAIN WRAPPER CLASS
   ============================================================ */

export class AdWorm {
  constructor(id, mountEl, config = {}) {
    this.id = id;
    this.mountEl = mountEl;

    // Component (engine wrapper)
    this.component = createAdWormComponent(id, config);

    // UI binding (DOM-aware)
    this.ui = createAdWormUI(id, mountEl, config);

    // Visuals (animation + easing)
    this.visuals = createAdWormVisuals(this.ui, config);
  }

  /* ------------------------------------------------------------
     PUBLIC: start worm
     ------------------------------------------------------------ */
  start() {
    this.component.start();
  }

  /* ------------------------------------------------------------
     PUBLIC: stop worm
     ------------------------------------------------------------ */
  stop() {
    this.component.stop();
    this.visuals.stop();
  }

  /* ------------------------------------------------------------
     PUBLIC: destroy worm
     ------------------------------------------------------------ */
  destroy() {
    this.stop();
    this.visuals.destroy();
    this.ui.destroy();
    this.component.destroy();
  }

  /* ------------------------------------------------------------
     PUBLIC: get current node
     ------------------------------------------------------------ */
  current() {
    return this.component.current();
  }
}

/* ============================================================
   FACTORY FUNCTION
   ============================================================ */

export function createAdWorm(id, mountEl, config = {}) {
  return new AdWorm(id, mountEl, config);
}
