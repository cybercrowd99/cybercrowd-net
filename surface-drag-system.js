class SurfaceDragStore {
  constructor(storageKey = "cybercrowd.surface.positions") {
    this.storageKey = storageKey;
    this._cache = null;
  }

  _load() {
    if (this._cache) return this._cache;
    try {
      const raw = window.localStorage.getItem(this.storageKey);
      this._cache = raw ? JSON.parse(raw) : {};
    } catch {
      this._cache = {};
    }
    return this._cache;
  }

  _save() {
    try {
      window.localStorage.setItem(this.storageKey, JSON.stringify(this._cache));
    } catch {
      // ignore storage errors
    }
  }

  get(surfaceId) {
    const data = this._load();
    return data[surfaceId] || { x: 0, y: 0 };
  }

  set(surfaceId, position) {
    const data = this._load();
    data[surfaceId] = { x: position.x, y: position.y };
    this._save();
  }
}

export class SurfaceDragSystem {
  constructor({ surfaceId, handleElement, targetElement, locked = true }) {
    if (!surfaceId) throw new Error("SurfaceDragSystem requires a surfaceId.");
    if (!handleElement || !targetElement) {
      throw new Error("SurfaceDragSystem requires handleElement and targetElement.");
    }

    this.surfaceId = surfaceId;
    this.handleElement = handleElement;
    this.targetElement = targetElement;
    this.locked = locked;

    this.store = new SurfaceDragStore();

    this._active = false;
    this._startX = 0;
    this._startY = 0;
    this._originX = 0;
    this._originY = 0;
    this._currentX = 0;
    this._currentY = 0;

    this._pointerMove = this._pointerMove.bind(this);
    this._pointerUp = this._pointerUp.bind(this);
    this._pointerDown = this._pointerDown.bind(this);

    this._init();
  }

  _init() {
    // restore last position
    const saved = this.store.get(this.surfaceId);
    this._currentX = saved.x;
    this._currentY = saved.y;
    this._applyTransform();

    this._updateCursor();
    this.handleElement.addEventListener("pointerdown", this._pointerDown);
  }

  _updateCursor() {
    this.handleElement.style.cursor = this.locked ? "default" : "grab";
  }

  lock() {
    this.locked = true;
    this._updateCursor();
  }

  unlock() {
    this.locked = false;
    this._updateCursor();
  }

  toggleLock() {
    this.locked = !this.locked;
    this._updateCursor();
    return this.locked;
  }

  _pointerDown(event) {
    if (this.locked) return;

    event.preventDefault();

    this._active = true;
    this._startX = event.clientX;
    this._startY = event.clientY;

    const style = window.getComputedStyle(this.targetElement);
    const matrix = new DOMMatrixReadOnly(style.transform === "none" ? undefined : style.transform);

    this._originX = matrix.m41;
    this._originY = matrix.m42;

    this.handleElement.style.cursor = "grabbing";
    this.targetElement.style.willChange = "transform";

    window.addEventListener("pointermove", this._pointerMove);
    window.addEventListener("pointerup", this._pointerUp);
  }

  _pointerMove(event) {
    if (!this._active) return;

    const dx = event.clientX - this._startX;
    const dy = event.clientY - this._startY;

    let nextX = this._originX + dx;
    let nextY = this._originY + dy;

    // clamp to viewport bounds
    const rect = this.targetElement.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const width = rect.width;
    const height = rect.height;

    const minX = -rect.left + this._originX;
    const maxX = vw - rect.right + this._originX;
    const minY = -rect.top + this._originY;
    const maxY = vh - rect.bottom + this._originY;

    nextX = Math.min(Math.max(nextX, minX), maxX);
    nextY = Math.min(Math.max(nextY, minY), maxY);

    this._currentX = nextX;
    this._currentY = nextY;

    this._applyTransform();
  }

  _pointerUp() {
    if (!this._active) return;

    this._active = false;

    window.removeEventListener("pointermove", this._pointerMove);
    window.removeEventListener("pointerup", this._pointerUp);

    this.handleElement.style.cursor = "grab";
    this.targetElement.style.willChange = "auto";

    // persist final position
    this.store.set(this.surfaceId, {
      x: this._currentX,
      y: this._currentY
    });
  }

  _applyTransform() {
    this.targetElement.style.transform = `translate3d(${this._currentX}px, ${this._currentY}px, 0)`;
  }
}
