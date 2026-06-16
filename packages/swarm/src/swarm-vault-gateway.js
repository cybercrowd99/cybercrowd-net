export function createSwarmVaultGateway(options = {}) {
  const room = options.room || "museum-vault";
  const page = options.page || "vault.html";

  const allowedWindows = new Set([
    "index.html",
    "vault.html",
    "create-account.html",
    "email-sent.html",
    "verify.html",
    "set-password.html",
    "dashboard-surface.html"
  ]);

  const flow = {
    "index.html": "vault.html",
    "vault.html": "create-account.html",
    "create-account.html": "email-sent.html",
    "verify.html": "set-password.html",
    "set-password.html": "dashboard-surface.html"
  };

  return {
    room,
    page,

    createSignal(type, payload = {}) {
      return {
        type,
        room,
        page,
        payload,
        at: Date.now()
      };
    },

    allowWindow(windowName) {
      return allowedWindows.has(windowName);
    },

    nextWindow(currentWindow) {
      return flow[currentWindow] || null;
    }
  };
}

export default createSwarmVaultGateway;
