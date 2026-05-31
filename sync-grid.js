export default {
  id: "sync-grid",
  organ: "defense",
  version: 1,
  start(engine) {
    const grid = {
      continuity: 1,
      core: 1,
      defense: 1,
      surface: 1,
      channel: 1,
      signal: 1,
      identity: 1,
      presence: 1
    };

    const rebalance = () => {
      const total = Object.values(grid).reduce((a, b) => a + b, 0);
      const avg = total / Object.keys(grid).length;

      for (const k in grid) {
        if (grid[k] > avg * 1.5) grid[k] = avg;
        if (grid[k] < avg * 0.5) grid[k] = avg;
      }

      const signature = Object.entries(grid)
        .map(([k, v]) => `${k}:${v}`)
        .join("|")
        .toLowerCase();

      engine.surface.pulse(`grid-${signature}`);
    };

    this.timer = setInterval(rebalance, 3500);
  },
  stop() {
    clearInterval(this.timer);
  }
};
