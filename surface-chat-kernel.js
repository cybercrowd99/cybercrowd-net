export class SurfaceChatKernel {
  constructor() {
    this._messages = [];
    this._lastUpdate = 0;
    this._pending = [];
  }

  addMessage(msg) {
    const entry = {
      id: crypto.randomUUID(),
      text: msg.text || "",
      role: msg.role || "user",
      timestamp: Date.now()
    };
    this._messages.push(entry);
    this._lastUpdate = entry.timestamp;
    return entry;
  }

  queueMessage(msg) {
    this._pending.push({
      text: msg.text || "",
      role: msg.role || "assistant",
      timestamp: Date.now()
    });
  }

  flushPending() {
    const flushed = [];
    while (this._pending.length > 0) {
      const p = this._pending.shift();
      const entry = {
        id: crypto.randomUUID(),
        text: p.text,
        role: p.role,
        timestamp: Date.now()
      };
      this._messages.push(entry);
      flushed.push(entry);
      this._lastUpdate = entry.timestamp;
    }
    return flushed;
  }

  getState() {
    return {
      updatedAt: this._lastUpdate,
      messages: [...this._messages]
    };
  }
}
