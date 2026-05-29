export class SurfaceHeartbeatEngine {
  constructor({ intervalMs, onTick }) {
    this.intervalMs = intervalMs;
    this.onTick = onTick;
    this._timer = null;
    this._tickCount = 0;
  }

  start() {
    if (this._timer) return;
    this._timer = setInterval(() => {
      const ts = Date.now();
      const tick = {
        count: ++this._tickCount,
        timestamp: ts
      };
      this.onTick(tick);
    }, this.intervalMs);
  }

  stop() {
    if (!this._timer) return;
    clearInterval(this._timer);
    this._timer = null;
  }

  isRunning() {
    return this._timer !== null;
  }
}
