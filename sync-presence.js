export default {
  id: "sync-presence",
  organ: "defense",
  version: 1,
  start(engine) {
    engine.identity.onChange((state) => {
      if (state === "LIVE") engine.surface.pulse("presence-live");
      if (state === "BLANK") engine.surface.pulse("presence-blank");
      if (state === "RE-PRESENCE") engine.surface.pulse("presence-requalifying");
    });
  }
};
