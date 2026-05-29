export class SurfaceChatContinuityEngine {
  constructor({ kernel }) {
    this.kernel = kernel;
    this._snapshot = null;
    this._timestamp = 0;
  }

  save() {
    const state = this.kernel.getState();
    this._snapshot = JSON.parse(JSON.stringify(state));
    this._timestamp = Date.now();
    return this._snapshot;
  }

  restore() {
    if (!this._snapshot) return null;

    const restored = this._snapshot.messages || [];
    restored.forEach(msg => {
      this.kernel.addMessage({
        text: msg.text,
        role: msg.role
      });
    });

    return {
      restoredCount: restored.length,
      timestamp: this._timestamp
    };
  }

  getSnapshot() {
    return {
      timestamp: this._timestamp,
      snapshot: this._snapshot
    };
  }
}
