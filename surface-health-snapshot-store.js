export class SurfaceHealthSnapshotStore {
  constructor() {
    this._state = [];
    this._timestamp = 0;
  }

  update(state) {
    this._state = Array.isArray(state) ? state : [];
    this._timestamp = Date.now();
  }

  getSnapshot() {
    return {
      timestamp: this._timestamp,
      surfaces: this._state
    };
  }
}
