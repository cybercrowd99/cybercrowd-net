/* ============================================================
   adWorm — COMPONENT WRAPPER LAYER
   CyberCrowd Layer 1 Broadcast Subsystem
   Purpose: wrap engine into a UI‑agnostic component interface
   No DOM. No rendering. No styling.
   ============================================================ */

import { createAdWormEngine } from "./adworm.engine.js";

/* ============================================================
   COMPONENT CLASS
   ============================================================ */

export class AdWormComponent {
  constructor(id, config = {}) {
    this.id = id;
    this.config = config;
    this.engine = createAdWormEngine(id, config);

    this.onStep = null;     // callback for node changes
    this.onStart = null;    // callback when engine starts
    this.onStop = null;     // callback when engine stops
  }

  /* ------------------------------------------------------------
     PUBLIC: start component
     ------------------------------------------------------------ */
  start() {
    this.engine.start();
    if (typeof this.onStart === "function") {
      this.onStart(this.id);
    }
  }

  /* ------------------------------------------------------------
     PUBLIC: stop component
     ------------------------------------------------------------ */
  stop() {
    this.engine.stop();
    if (typeof this.onStop === "function") {
      this.onStop(this.id);
    }
  }

  /* ------------------------------------------------------------
     PUBLIC: get current node
     ------------------------------------------------------------ */
  current() {
    return this.engine.current();
  }

  /* ------------------------------------------------------------
     PUBLIC: subscribe to step events
     ------------------------------------------------------------ */
  setStepHandler(fn) {
    if (typeof fn !== "function") return;
    this.onStep = fn;

    // patch engine step behavior
    const originalStep = this.engine.current.bind(this.engine);

    this.engine.current = () => {
      const node = originalStep();
      if (this.onStep) this.onStep(node);
      return node;
    };
  }

  /* ------------------------------------------------------------
     PUBLIC: update config
     ------------------------------------------------------------ */
  updateConfig(newConfig = {}) {
    this.engine.config = { ...this.engine.config, ...newConfig };
  }

  /* ------------------------------------------------------------
     PUBLIC: destroy component
     ------------------------------------------------------------ */
  destroy() {
    this.engine.destroy();
    this.onStep = null;
    this.onStart = null;
    this.onStop = null;
  }
}

/* ============================================================
   FACTORY FUNCTION
   ============================================================ */

export function createAdWormComponent(id, config = {}) {
  return new AdWormComponent(id, config);
}
