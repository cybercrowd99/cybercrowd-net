export default {
  id: "sync-core",
  organ: "defense",
  version: 1,
  start(engine) {
    const states = {
      presence: engine.identity.getPresenceState(),
      identity: engine.identity.getPresenceState(),
      signal: "idle",
      channel: "open",
      surface: "ready",
      defense: "nominal"
    };

    const emit = () => {
      engine.surface.pulse(`core-${Object.values(states).join("-").toLowerCase()}`);
    };

    engine.identity.onChange((v) => { states.identity = v; emit(); });
    engine.surface.on("state", (v) => { states.surface = v; emit(); });
    engine.channel.on("update", (v) => { states.channel = v; emit(); });
    engine.surface.on("signal", (v) => { states.signal = v; emit(); });
    engine.defense.on("alert", (v) => { states.defense = v; emit(); });
  }
};
