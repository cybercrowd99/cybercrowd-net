import { eventBus } from "./core/event-bus.js";
import { worldState } from "./core/world-state.js";

import { initTurnstile } from "./identity/turnstile.js";
import { initIdentitySocket } from "./identity/identity-socket.js";
import { initPortalAnchor } from "./portal/portal-anchor.js";
import { initPassthroughStream } from "./portal/passthrough-stream.js";
import { initMovementMapper } from "./portal/movement-mapper.js";

export async function bootXRRoom(config = {}) {
  worldState.init(config);

  eventBus.emit("xr-room:booting", {
    time: Date.now()
  });

  await initTurnstile();
  await initIdentitySocket();
  await initPortalAnchor();
  await initPassthroughStream();
  await initMovementMapper();

  eventBus.emit("xr-room:ready", {
    state: worldState.snapshot()
  });
}
