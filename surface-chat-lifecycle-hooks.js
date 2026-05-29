export class SurfaceChatLifecycleHooks {
  constructor({ kernel, renderEngine, continuity, bus, heartbeat }) {
    this.kernel = kernel;
    this.renderEngine = renderEngine;
    this.continuity = continuity;
    this.bus = bus;
    this.heartbeat = heartbeat;

    this._bindHeartbeat();
    this._bindVisibility();
  }

  _bindHeartbeat() {
    if (!this.heartbeat) return;
    this.heartbeat.subscribe(() => {
      this.kernel.flushPending();
      this.renderEngine.render();
    });
  }

  _bindVisibility() {
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.continuity.save();
      } else {
        this.continuity.restore();
        this.renderEngine.render();
      }
    });
  }
}
