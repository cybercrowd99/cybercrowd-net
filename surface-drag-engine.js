export class SurfaceDragEngine {
  constructor({ onStart, onMove, onEnd } = {}) {
    this.onStart = onStart || (() => {});
    this.onMove = onMove || (() => {});
    this.onEnd = onEnd || (() => {});

    this._active = false;
    this._startX = 0;
    this._startY = 0;
    this._originX = 0;
    this._originY = 0;
    this._currentX = 0;
    this._currentY = 0;

    this._pointerMove = this._pointerMove.bind(this);
    this._pointerUp = this._pointerUp.bind(this);
  }

  attach(handleElement, targetElement) {
    if (!handleElement || !targetElement) {
      throw new Error("SurfaceDragEngine.attach requires handleElement and targetElement.");
    }

    this.handleElement = handleElement;
    this.targetElement = targetElement;

    handleElement.style.cursor = "grab";
    handleElement.addEventListener("pointerdown", (event) => this._pointerDown(event));
  }

  _pointerDown(event) {
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

    this.onStart({
      x: this._originX,
      y: this._originY
    });
  }

  _pointerMove(event) {
    if (!this._active) return;

    const dx = event.clientX - this._startX;
    const dy = event.clientY - this._startY;

    this._currentX = this._originX + dx;
    this._currentY = this._originY + dy;

    this.targetElement.style.transform = `translate3d(${this._currentX}px, ${this._currentY}px, 0)`;

    this.onMove({
      x: this._currentX,
      y: this._currentY,
      dx,
      dy
    });
  }

  _pointerUp() {
    if (!this._active) return;

    this._active = false;

    window.removeEventListener("pointermove", this._pointerMove);
    window.removeEventListener("pointerup", this._pointerUp);

    this.handleElement.style.cursor = "grab";
    this.targetElement.style.willChange = "auto";

    this.onEnd({
      x: this._currentX,
      y: this._currentY
    });
  }
}
