export class SurfaceChatAssistantBridge {
  constructor({ bus, endpoint }) {
    this.bus = bus;
    this.endpoint = endpoint;
    this._wireBus();
  }

  _wireBus() {
    this.bus.subscribe(event => {
      if (event.type === "user_message") {
        this._sendToAssistant(event.entry);
      }
    });
  }

  async _sendToAssistant(entry) {
    try {
      const res = await fetch(this.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: entry.text, id: entry.id, role: entry.role })
      });

      if (!res.ok) return;

      const data = await res.json();
      const reply = data.reply || "";

      if (reply) {
        this.bus.sendAssistantMessage(reply);
      }
    } catch (_) {
      // assistant failures are non-fatal to the chat surface
    }
  }
}
