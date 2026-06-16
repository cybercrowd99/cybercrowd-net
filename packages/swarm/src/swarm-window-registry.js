const WINDOWS = {
  LANDING: "index.html",
  VAULT: "vault.html",
  CREATE_ACCOUNT: "create-account.html",
  EMAIL_SENT: "email-sent.html",
  VERIFY: "verify.html",
  SET_PASSWORD: "set-password.html",
  DASHBOARD: "dashboard-surface.html"
};

const FLOW = {
  [WINDOWS.LANDING]: WINDOWS.VAULT,
  [WINDOWS.VAULT]: WINDOWS.CREATE_ACCOUNT,
  [WINDOWS.CREATE_ACCOUNT]: WINDOWS.EMAIL_SENT,
  [WINDOWS.VERIFY]: WINDOWS.SET_PASSWORD,
  [WINDOWS.SET_PASSWORD]: WINDOWS.DASHBOARD
};

export function createWindowRegistry() {
  return {
    list() {
      return Object.values(WINDOWS);
    },

    exists(windowName) {
      return Object.values(WINDOWS).includes(windowName);
    },

    next(windowName) {
      return FLOW[windowName] || null;
    },

    isTerminal(windowName) {
      return windowName === WINDOWS.DASHBOARD;
    }
  };
}

export default createWindowRegistry;
