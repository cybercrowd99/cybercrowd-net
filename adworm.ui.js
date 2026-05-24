/* ============================================================
   adWorm — UI LAYER
   CyberCrowd Layer 1 Broadcast Subsystem
   Depends on: adworm.component.js
   Provides: DOM element, audio rules, click-entry logic
   No animation. No CSS. No styling.
   ============================================================ */

import { createAdWormComponent } from "./adworm.component.js";

/* ============================================================
   AUDIO DOCTRINE
   ============================================================ */

const ForcedAdMode = false; // CyberCrowd default

let AudioEnabled = ForcedAdMode ? true : false;

/* ============================================================
   UI CLASS
   ============================================================ */

export class AdWormUI {
  constructor(id, config = {}) {
    this.id = id;
    this.component = createAdWormComponent(id, config);

    this.element = this.createElement();
    this.audio = this.createAudio(config.audioSrc || null);

    this.bindEvents();
  }

  /* ------------------------------------------------------------
     Create DOM element (no styling)
     ------------------------------------------------------------ */
  createElement() {
    const el = document.createElement("div");
    el.id = `adworm-${this.id}`;
    el.setAttribute("data-adworm", this.id);
    el.style.position = "absolute"; // minimal requirement
    return el;
  }

  /* ------------------------------------------------------------
     Optional audio element
     ------------------------------------------------------------ */
  createAudio(src) {
    if (!src) return null;

    const audio = new Audio(src);
    audio.preload = "auto";
    audio.autoplay = false;
    audio.controls = false;

    return audio;
  }

  /* ------------------------------------------------------------
     Bind click → enable audio (CyberCrowd rule)
     ------------------------------------------------------------ */
  bindEvents() {
    this.element.addEventListener("click", () => {
      if (!AudioEnabled) {
        AudioEnabled = true;
        if (this.audio) this.audio.play().catch(() => {});
      }
    });
  }

  /* ------------------------------------------------------------
     Public: attach UI to container
     ------------------------------------------------------------ */
  mount(container) {
    container.appendChild(this.element);
  }

  /* ------------------------------------------------------------
     Public: start/stop/destroy
     ------------------------------------------------------------ */
  start() {
    this.component.start();
  }

  stop() {
    this.component.stop();
  }

  destroy() {
    this.component.destroy();
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }

  /* ------------------------------------------------------------
     Public: get current node
     ------------------------------------------------------------ */
  current() {
    return this.component.current();
  }
}

/* ============================================================
   FACTORY FUNCTION
   ============================================================ */

export function createAdWormUI(id, config = {}) {
  return new AdWormUI(id, config);
}
