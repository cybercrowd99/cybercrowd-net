export const PortRegistry = {
  _assigned: new Map(),
  _listeners: new Set(),

  organ() {
    return "port-registry";
  },

  claim(organ, port) {
    if (this._assigned.has(organ)) {
      return this._assigned.get(organ);
    }

    for (const [o, p] of this._assigned.entries()) {
      if (p === port) {
        throw new Error(
          "CyberCrowd Port Collision: organ '" + organ + "' attempted to claim port " + port + ", already held by '" + o + "'"
        );
      }
    }

    this._assigned.set(organ, port);
    this._emit({ type: "claim", organ, port });
    return port;
  },

  get(organ) {
    return this._assigned.get(organ) || null;
  },

  ensure(organ, port) {
    const existing = this._assigned.get(organ);
    if (existing != null) return existing;
    return this.claim(organ, port);
  },

  subscribe(fn) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  },

  _emit(evt) {
    for (const fn of this._listeners) {
      try {
        fn(evt);
      } catch (_) {}
    }
  },

  topology() {
    return Array.from(this._assigned.entries()).map(([organ, port]) => ({
      organ,
      port
    }));
  }
};

export const DefaultPorts = {
  "mesh.discovery": 4000,
  "mesh.file-transfer": 4001,
  "cursor.sync": 4002,
  "camera.switch": 4003,
  "director.control": 4004,
  "heartbeat.sync": 4005,
  "surface.animation": 4006
};

export function initializePortRegistry() {
  for (const [organ, port] of Object.entries(DefaultPorts)) {
    PortRegistry.ensure(organ, port);
  }
  return PortRegistry;
}
