import { SurfaceChatLoader } from "./surface-chat-loader.js";

export class SurfaceChatActivation {
  constructor({ registry, heartbeat }) {
    this.loader = new SurfaceChatLoader({ registry, heartbeat });
    this._loaded = false;
  }

  async activate() {
    if (!this._loaded) {
      await this.loader.load();
      this._loaded = true;
    }

    // mount the chat window surface
    window.openSurface("surface.chat");

    return {
      status: "activated",
      surface: "surface.chat"
    };
  }

  deactivate() {
    // sovereign engine handles unmounting
    return {
      status: "deactivated",
      surface: "surface.chat"
    };
  }
}
