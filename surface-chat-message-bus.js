export class SurfaceChatMessageBus {
  constructor({ kernel }) {
    this.kernel = kernel;
    this._subscribers = new Set();
  }

  subscribe(fn) {
    if (typeof fn === "function") {
      this._subscribers.add(fn);
    }
  }

  unsubscribe(fn) {
    this._subscribers.delete(fn);
  }

  sendUserMessage(text) {
    const entry = this.kernel.addMessage({ text, role: "user" });
    this._broadcast({ type: "user_message", entry });
    return entry;
  }

  sendAssistantMessage(text) {
    this.kernel.queueMessage({ text, role: "assistant" });
    const flushed = this.kernel.flushPending();
    flushed.forEach(entry => {
      this._broadcast({ type: "assistant_message", entry });
    });
    return flushed;
  }

  _broadcast(event) {
    for (const fn of this._subscribers) {
      try {
        fn(event);
      } catch (_) {
        // ignore subscriber errors
      }
    }
  }
}
