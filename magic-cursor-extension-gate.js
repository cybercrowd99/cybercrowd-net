// magic-cursor-extension-gate.js
// CyberCrowd Magic Cursor — Extension Access Gate
// Owns: Magic Cursor extension access state only.
// Does not move cursor, pair devices, run transport, or grant OS control.

const MagicCursorExtensionGate = (() => {
  const STATE_LOCKED = "locked";
  const STATE_ACTIVE = "active";
  const STATE_TRIAL = "trial";
  const STATE_EXPIRED = "expired";

  const EXTENSION_ID = "magic-cursor";
  const EXTENSION_PRICE = "3.99";

  let access = {
    extension_id: EXTENSION_ID,
    name: "Magic Cursor",
    price_usd: EXTENSION_PRICE,
    state: STATE_LOCKED,
    reason: "not_activated",
    activated_at: null,
    expires_at: null,
    updated_at: new Date().toISOString()
  };

  function now() {
    return new Date().toISOString();
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function setAccess({ state, reason = "manual_update", activatedAt = null, expiresAt = null } = {}) {
    if (![STATE_LOCKED, STATE_ACTIVE, STATE_TRIAL, STATE_EXPIRED].includes(state)) {
      throw new Error("Invalid Magic Cursor extension access state.");
    }

    access = {
      ...access,
      state,
      reason,
      activated_at: activatedAt,
      expires_at: expiresAt,
      updated_at: now()
    };

    return clone(access);
  }

  function activate(reason = "extension_purchase_confirmed") {
    return setAccess({
      state: STATE_ACTIVE,
      reason,
      activatedAt: now(),
      expiresAt: null
    });
  }

  function startTrial({ expiresAt, reason = "trial_started" } = {}) {
    if (!expiresAt) {
      throw new Error("Trial requires expiresAt.");
    }

    return setAccess({
      state: STATE_TRIAL,
      reason,
      activatedAt: now(),
      expiresAt
    });
  }

  function lock(reason = "extension_locked") {
    return setAccess({
      state: STATE_LOCKED,
      reason,
      activatedAt: null,
      expiresAt: null
    });
  }

  function expire(reason = "extension_expired") {
    return setAccess({
      state: STATE_EXPIRED,
      reason
    });
  }

  function isAllowed() {
    if (access.state === STATE_ACTIVE) return true;

    if (access.state === STATE_TRIAL && access.expires_at) {
      return new Date(access.expires_at).getTime() > Date.now();
    }

    return false;
  }

  function requireAccess() {
    if (!isAllowed()) {
      throw new Error("Magic Cursor extension access is locked.");
    }

    return true;
  }

  function getAccess() {
    return clone(access);
  }

  return {
    activate,
    startTrial,
    lock,
    expire,
    isAllowed,
    requireAccess,
    getAccess
  };
})();

if (typeof window !== "undefined") {
  window.MagicCursorExtensionGate = MagicCursorExtensionGate;
}

export default MagicCursorExtensionGate;
