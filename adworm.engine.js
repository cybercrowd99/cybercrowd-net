/* ============================================================
   adWorm — BASE ENGINE LAYER
   CyberCrowd Layer 1 Broadcast Subsystem
   Depends on: adworm.foundation.js
   Provides: timing, scheduling, movement control
   No UI. No rendering. No DOM.
   ============================================================ */

import { adWorm, ADWORM_PATH } from "./adworm.foundation.js";

/* ============================================================
   DEFAULT ENGINE CONFIG
   ============================================================ */

export const ADWORM_ENGINE_DEFAULTS = Object.freeze({
  railTime: 2200,     // ms between rail nodes
  cornerTime: 1400,   // ms dwell at corners
  autoStart: true
});

/* ============================================================
   ENGINE CLASS
   ============================================================ */

export class AdWormEngine {
  constructor(id, config = {}) {
    this.id = id;
    this.config = { ...ADWORM_ENGINE_DEFAULTS, ...config };
    this.timer = null;
    this.running = false;

    // ensure instance exists in registry
    adWorm.create(id, config);

    if (this.config.autoStart) {
      this.start();
    }
  }

  /* ------------------------------------------------------------
     INTERNAL: schedule next step
     ------------------------------------------------------------ */
  scheduleNext() {
    const current = adWorm.current(this.id);
    const delay = current.type === "corner"
      ? this.config.cornerTime
      : this.config.railTime;

    this.timer = setTimeout(() => {
      adWorm.step(this.id);
      if (this.running) this.scheduleNext();
    }, delay);
  }

  /* ------------------------------------------------------------
     PUBLIC: start engine
     ------------------------------------------------------------ */
  start() {
    if (this.running) return;
    this.running = true;
    this.scheduleNext();
  }

  /* ------------------------------------------------------------
     PUBLIC: stop engine
     ------------------------------------------------------------ */
  stop() {
    this.running = false;
    clearTimeout(this.timer);
    this.timer = null;
  }

  /* ------------------------------------------------------------
     PUBLIC: get current node
     ------------------------------------------------------------ */
  current() {
    return adWorm.current(this.id);
  }

  /* ------------------------------------------------------------
     PUBLIC: destroy engine + registry instance
     ------------------------------------------------------------ */
  destroy() {
    this.stop();
    adWorm.destroy(this.id);
  }
}

/* ============================================================
   FACTORY FUNCTION
   ============================================================ */

export function createAdWormEngine(id, config = {}) {
  return new AdWormEngine(id, config);
}
