export default {
  id: "sync-heartbeat",
  organ: "defense",
  version: 1,
  interval: 3000,
  start(engine) {
    this.timer = setInterval(() => {
      const p = engine.identity.getPresenceState();
      if (p === "LIVE") engine.surface.pulse("heartbeat-ok");
      if (p === "BLANK") { engine.surface.pulse("heartbeat-missing"); engine.defense.flag("presence-desync"); }
      if (p === "RE-PRESENCE") engine.surface.pulse("heartbeat-requalifying");
    }, this.interval);
  },
  stop() {
    clearInterval(this.timer);
  }
};
