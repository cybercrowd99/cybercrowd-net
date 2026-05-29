export class SurfaceChatRenderEngine {
  constructor({ kernel, root }) {
    this.kernel = kernel;
    this.root = root;
    this._lastRendered = 0;
  }

  render() {
    const state = this.kernel.getState();
    if (state.updatedAt === this._lastRendered) return;

    this._lastRendered = state.updatedAt;

    const messages = state.messages || [];
    const html = messages.map(m => {
      const cls = m.role === "assistant" ? "assistant" : "user";
      const time = new Date(m.timestamp).toLocaleTimeString();
      return `
        <div class="msg ${cls}">
          <div class="text">${m.text}</div>
          <div class="time">${time}</div>
        </div>
      `;
    }).join("");

    this.root.innerHTML = html;

    // scroll to bottom deterministically
    this.root.scrollTop = this.root.scrollHeight;
  }
}
