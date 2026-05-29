export class SurfaceChatInputRail {
  constructor({ bus, inputElement }) {
    this.bus = bus;
    this.input = inputElement;
    this.disabled = false;

    this.input.addEventListener("keydown", e => this._onKey(e));
  }

  _onKey(e) {
    if (this.disabled) return;

    // Shift+Enter inserts newline
    if (e.key === "Enter" && e.shiftKey) {
      return;
    }

    // Enter sends message
    if (e.key === "Enter") {
      e.preventDefault();
      const text = this.input.value.trim();
      if (text.length > 0) {
        this.bus.sendUserMessage(text);
      }
      this.input.value = "";
    }
  }

  setDisabled(state) {
    this.disabled = !!state;
    this.input.disabled = this.disabled;
  }
}
