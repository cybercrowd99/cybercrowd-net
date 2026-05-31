export default {
  id: "sync-continuity",
  organ: "defense",
  version: 1,
  start(engine) {
    let last = Date.now();

    const tick = () => {
      const now = Date.now();
      const drift = now - last;
      last = now;

      if (drift > 5000) {
        engine.defense.flag("continuity-drift");
        engine.surface.pulse("continuity-realign");
      } else {
        engine.surface.pulse("continuity-ok");
      }
    };

    this.timer = setInterval(tick, 2000);
  },
  stop() {
    clearInterval(this.timer);
  }
};
