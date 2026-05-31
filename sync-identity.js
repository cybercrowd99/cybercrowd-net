export default {
  id: "sync-identity",
  organ: "defense",
  version: 1,
  start(engine) {
    const state = engine.identity.getPresenceState();
    engine.surface.pulse(`identity-${state.toLowerCase()}`);

    engine.identity.onChange((next) => {
      engine.surface.pulse(`identity-${next.toLowerCase()}`);
      if (next === "BLANK") engine.defense.flag("identity-desync");
    });
  }
};
