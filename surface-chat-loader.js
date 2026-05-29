import { SurfaceChatRegistrar } from "./surface-chat-registrar.js";
import { SurfaceChatManifest } from "./surface-chat-manifest.js";

export class SurfaceChatLoader {
  constructor({ registry, heartbeat }) {
    this.registry = registry;
    this.heartbeat = heartbeat;
    this.registrar = new SurfaceChatRegistrar({ registry, heartbeat });
  }

  async load() {
    // register the surface
    const id = this.registrar.register();

    // preload assets
    for (const asset of SurfaceChatManifest.assets) {
      await import(`./${asset}`);
    }

    return {
      id,
      status: "ready"
    };
  }
}
