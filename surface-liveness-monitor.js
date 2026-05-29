export class SurfaceLivenessMonitor {
  constructor({ timeoutMs }) {
    this.timeoutMs = timeoutMs;
    this._surfaces = new Map();
  }

  registerSurface(id) {
    if (!this._surfaces.has(id)) {
      this._surfaces.set(id, {
        id,
        lastSeen: Date.now(),
        alive: true
      });
    }
  }

  markAlive(id) {
    const s = this._surfaces.get(id);
    if (!s) return;
    s.lastSeen = Date.now();
    s.alive = true;
  }

  evaluate() {
    const now = Date.now();
    const results = [];

    for (const [id, s] of this._surfaces.entries()) {
      const delta = now - s.lastSeen;
      const alive = delta <= this.timeoutMs;

      s.alive = alive;

      results.push({
        id,
        alive,
        lastSeen: s.lastSeen,
        delta
      });
    }

    return results;
  }
}
