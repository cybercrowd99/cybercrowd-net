/* ============================================================
   adWorm — VISUALS / ANIMATION ENGINE
   CyberCrowd Layer 1 Broadcast Subsystem
   Purpose: animate transforms over time using easing curves
   No CSS. No design. No DOM creation.
   ============================================================ */

import { createAdWormRenderEngine } from "./adworm.render.js";

/* ============================================================
   EASING FUNCTIONS
   ============================================================ */

export const EASING = {
  linear: (t) => t,
  easeInQuad: (t) => t * t,
  easeOutQuad: (t) => t * (2 - t),
  easeInOutQuad: (t) =>
    t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
};

/* ============================================================
   ANIMATION ENGINE
   ============================================================ */

export class AdWormVisuals {
  constructor(uiInstance, config = {}) {
    if (!uiInstance) {
      throw new Error("[adWorm][Visuals] uiInstance is required.");
    }

    this.ui = uiInstance;
    this.renderer = createAdWormRenderEngine(config.frame);

    this.easing = config.easing || EASING.easeInOutQuad;
    this.duration = config.duration || 600; // ms per transition

    this.animFrame = null;
    this.startTime = null;

    this.currentNode = null;
    this.nextNode = null;

    this._bindUI();
  }

  /* ------------------------------------------------------------
     INTERNAL: bind to UI component events
     ------------------------------------------------------------ */
  _bindUI() {
    this.ui.component.setStepHandler((node) => {
      this.currentNode = node;

      const nextIndex = (node.index + 1) % 8;
      this.nextNode = { slot: this.ui.component.engine.current().slot, index: nextIndex };

      this._startAnimation();
    });
  }

  /* ------------------------------------------------------------
     INTERNAL: start animation cycle
     ------------------------------------------------------------ */
  _startAnimation() {
    this.startTime = performance.now();
    this._animate();
  }

  /* ------------------------------------------------------------
     INTERNAL: animation loop
     ------------------------------------------------------------ */
  _animate() {
    const now = performance.now();
    const elapsed = now - this.startTime;
    const t = Math.min(elapsed / this.duration, 1);

    const eased = this.easing(t);

    const packet = this.renderer.getTransformPacket(
      this.currentNode,
      this.nextNode,
      eased
    );

    this.ui.mountEl.style.transform =
      `translate(${packet.x}px, ${packet.y}px)`;

    if (t < 1) {
      this.animFrame = requestAnimationFrame(() => this._animate());
    }
  }

  /* ------------------------------------------------------------
     PUBLIC: stop animation
     ------------------------------------------------------------ */
  stop() {
    if (this.animFrame) {
      cancelAnimationFrame(this.animFrame);
      this.animFrame = null;
    }
  }

  /* ------------------------------------------------------------
     PUBLIC: destroy visuals
     ------------------------------------------------------------ */
  destroy() {
    this.stop();
    this.ui = null;
  }
}

/* ============================================================
   FACTORY
   ============================================================ */

export function createAdWormVisuals(uiInstance, config = {}) {
  return new AdWormVisuals(uiInstance, config);
}
