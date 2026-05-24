/* ============================================================
   adWorm — ANIMATION ENGINE
   CyberCrowd Layer 1 Broadcast Subsystem
   Depends on: adworm.integration.js
   Provides: movement logic, interpolation, frame stepping
   No CSS. No styling.
   ============================================================ */

import { ADWORM_PATH } from "./adworm.foundation.js";

/* ============================================================
   LINEAR INTERPOLATION
   ============================================================ */

function lerp(a, b, t) {
  return a + (b - a) * t;
}

/* ============================================================
   POSITION RESOLVER
   ============================================================ */

function getNodePosition(node) {
  return {
    x: node.x || 0,
    y: node.y || 0
  };
}

/* ============================================================
   ANIMATION CLASS
   ============================================================ */

export class AdWormAnimation {
  constructor(uiInstance, config = {}) {
    this.ui = uiInstance;
    this.speed = config.speed || 0.02; // interpolation speed
    this.active = false;

    this.currentNode = null;
    this.nextNode = null;
    this.t = 0;

    this.frame = null;

    this.bindToUI();
  }

  /* ------------------------------------------------------------
     Bind to UI position changes
     ------------------------------------------------------------ */
  bindToUI() {
    setInterval(() => {
      const node = this.ui.current();
      if (!node) return;

      if (!this.currentNode) {
        this.currentNode = node;
        this.nextNode = node;
        return;
      }

      if (node.id !== this.nextNode.id) {
        this.currentNode = this.nextNode;
        this.nextNode = node;
        this.t = 0;
      }
    }, 50);
  }

  /* ------------------------------------------------------------
     Animation loop
     ------------------------------------------------------------ */
  animate() {
    if (!this.active) return;

    const a = getNodePosition(this.currentNode);
    const b = getNodePosition(this.nextNode);

    this.t += this.speed;
    if (this.t > 1) this.t = 1;

    const x = lerp(a.x, b.x, this.t);
    const y = lerp(a.y, b.y, this.t);

    this.ui.element.style.transform = `translate(${x}px, ${y}px)`;

    this.frame = requestAnimationFrame(() => this.animate());
  }

  /* ------------------------------------------------------------
     Public: start/stop
     ------------------------------------------------------------ */
  start() {
    if (this.active) return;
    this.active = true;
    this.animate();
  }

  stop() {
    this.active = false;
    cancelAnimationFrame(this.frame);
  }
}

/* ============================================================
   FACTORY FUNCTION
   ============================================================ */

export function attachAdWormAnimation(uiInstance, config = {}) {
  const anim = new AdWormAnimation(uiInstance, config);
  anim.start();
  return anim;
}
