/* ============================================================
   adWorm — FOUNDATION LAYER
   CyberCrowd Layer 1 Broadcast Subsystem
   No UI. No rendering. No animation.
   Pure architecture + state + rules.
   ============================================================ */

export const ADWORM_POSITIONS = Object.freeze([
  "BL-01", // Bottom Left Corner
  "L-02",  // Left Rail
  "TL-03", // Top Left Corner
  "T-04",  // Top Rail
  "TR-05", // Top Right Corner
  "R-06",  // Right Rail
  "BR-07", // Bottom Right Corner
  "B-08"   // Bottom Rail
]);

export const ADWORM_NODE_TYPES = Object.freeze({
  CORNER: "corner",
  RAIL: "rail"
});

export const ADWORM_PATH = Object.freeze([
  { id: "BL-01", type: "corner" },
  { id: "L-02",  type: "rail"   },
  { id: "TL-03", type: "corner" },
  { id: "T-04",  type: "rail"   },
  { id: "TR-05", type: "corner" },
  { id: "R-06",  type: "rail"   },
  { id: "BR-07", type: "corner" },
  { id: "B-08",  type: "rail"   }
]);

/* ============================================================
   STATE MACHINE
   ============================================================ */

export class AdWormState {
  constructor() {
    this.index = 0;
    this.current = ADWORM_PATH[0];
    this.loopCount = 0;
  }

  next() {
    this.index = (this.index + 1) % ADWORM_PATH.length;
    this.current = ADWORM_PATH[this.index];

    if (this.index === 0) {
      this.loopCount++;
    }

    return this.current;
  }

  getCurrent() {
    return this.current;
  }

  getLoopCount() {
    return this.loopCount;
  }
}

/* ============================================================
   REGISTRY — MULTIPLE WORMS, MULTIPLE STREAMS
   ============================================================ */

export class AdWormRegistry {
  constructor() {
    this.instances = new Map();
  }

  create(id, config = {}) {
    if (this.instances.has(id)) {
      throw new Error(`adWorm instance '${id}' already exists`);
    }

    const state = new AdWormState();

    this.instances.set(id, {
      id,
      state,
      config,
      createdAt: Date.now()
    });

    return this.instances.get(id);
  }

  get(id) {
    return this.instances.get(id) || null;
  }

  all() {
    return Array.from(this.instances.values());
  }

  destroy(id) {
    this.instances.delete(id);
  }
}

/* ============================================================
   PUBLIC API — FOUNDATION ONLY
   ============================================================ */

export const adWorm = (() => {
  const registry = new AdWormRegistry();

  return {
    create: (id, config) => registry.create(id, config),
    get: (id) => registry.get(id),
    all: () => registry.all(),
    destroy: (id) => registry.destroy(id),

    // movement engine (no rendering)
    step: (id) => {
      const inst = registry.get(id);
      if (!inst) throw new Error(`adWorm '${id}' not found`);
      return inst.state.next();
    },

    current: (id) => {
      const inst = registry.get(id);
      if (!inst) throw new Error(`adWorm '${id}' not found`);
      return inst.state.getCurrent();
    }
  };
})();
