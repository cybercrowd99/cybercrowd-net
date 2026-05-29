export class SurfaceHealthRouter {
  constructor() {
    this._subscribers = new Set();
  }

  subscribe(fn) {
    if (typeof fn === "function") {
      this._subscribers.add(fn);
    }
  }

  unsubscribe(fn) {
    this._subscribers.delete(fn);
  }

  broadcast(healthState) {
    for (const fn of this._subscribers) {
      try {
        fn(healthState);
      } catch (_) {
        // subscriber errors do not halt routing
      }
    }
  }
}
