export default {
  id: "sync-lattice",
  organ: "defense",
  version: 1,
  start(engine) {
    const lattice = {
      continuity: { x: 0, y: 0 },
      core: { x: 1, y: 0 },
      defense: { x: 2, y: 0 },
      surface: { x: 0, y: 1 },
      channel: { x: 1, y: 1 },
      signal: { x: 2, y: 1 },
      identity: { x: 0, y: 2 },
      presence: { x: 1, y: 2 }
    };

    const emit = () => {
      const signature = Object.entries(lattice)
        .map(([k, v]) => `${k}:${v.x},${v.y}`)
        .join("|")
        .toLowerCase();

      engine.surface.pulse(`lattice-${signature}`);
    };

    this.timer = setInterval(emit, 4800);
  },
  stop() {
    clearInterval(this.timer);
  }
};
