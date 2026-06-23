// magic-cursor-extension-gate.js
// CyberCrowd Magic Cursor — Membership Capability / Update Access Gate
// Owns: Magic Cursor membership entitlement, availability, trial, expiry,
// update state, and access checks.
// This is not a separate purchase wall.
// Does not move cursor, pair devices, run transport, or grant OS control.

const MagicCursorExtensionGate = (() => {
  const STATE_LOCKED = "locked";
  const STATE_ACTIVE = "active";
  const STATE_TRIAL = "trial";
  const STATE_EXPIRED = "expired";

  const UPDATE_CURRENT = "current";
  const UPDATE_AVAILABLE = "update_available";
  const UPDATE_REQUIRED = "update_required";

  const CAPABILITY_ID = "magic-cursor";
  const CAPABILITY_NAME = "Magic Cursor";

  let access = {
    capability_id: CAPABILITY_ID,
    name: CAPABILITY_NAME,
    included_with_membership: true,
    separate_purchase_required: false,
    state: STATE_LOCKED,
    reason: "membership_not_active",
    membership_id: null,
    member_id: null,
    activated_at: null,
    expires_at: null,
    update_state: UPDATE_CURRENT,
    current_version: "0.1.0",
    required_version: "0.1.0",
    updated_at: new Date().toISOString()
  };

  function now() {
    return new Date().toISOString();
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function setAccess({
    state,
    reason = "manual_update",
    membershipId = access.membership_id,
    memberId = access.member_id,
    activatedAt = access.activated_at,
    expiresAt = access.expires_at,
    updateState = access.update_state,
    currentVersion = access.current_version,
    requiredVersion = access.required_version
  } = {}) {
    if (![STATE_LOCKED, STATE_ACTIVE, STATE_TRIAL, STATE_EXPIRED].includes(state)) {
      throw new Error("Invalid Magic Cursor membership access state.");
    }

    if (![UPDATE_CURRENT, UPDATE_AVAILABLE, UPDATE_REQUIRED].includes(updateState)) {
      throw new Error("Invalid Magic Cursor update state.");
    }

    access = {
      ...access,
      state,
      reason,
      membership_id: membershipId,
      member_id: memberId,
      activated_at: activatedAt,
      expires_at: expiresAt,
      update_state: updateState,
      current_version: currentVersion,
      required_version: requiredVersion,
      updated_at: now()
    };

    return clone(access);
  }

  function activateMembership({
    membershipId,
    memberId,
    reason = "membership_active"
  } = {}) {
    if (!membershipId) throw new Error("membershipId is required.");
    if (!memberId) throw new Error("memberId is required.");

    return setAccess({
      state: STATE_ACTIVE,
      reason,
      membershipId,
      memberId,
      activatedAt: now(),
      expiresAt: null
    });
  }

  function startTrial({
    membershipId = null,
    memberId = null,
    expiresAt,
    reason = "membership_trial_started"
  } = {}) {
    if (!expiresAt) throw new Error("Trial requires expiresAt.");

    return setAccess({
      state: STATE_TRIAL,
      reason,
      membershipId,
      memberId,
      activatedAt: now(),
      expiresAt
    });
  }

  function lock(reason = "membership_not_active") {
    return setAccess({
      state: STATE_LOCKED,
      reason,
      membershipId: null,
      memberId: null,
      activatedAt: null,
      expiresAt: null
    });
  }

  function expire(reason = "membership_expired") {
    return setAccess({
      state: STATE_EXPIRED,
      reason
    });
  }

  function setUpdateAvailable({
    requiredVersion,
    reason = "magic_cursor_update_available"
  } = {}) {
    if (!requiredVersion) throw new Error("requiredVersion is required.");

    return setAccess({
      state: access.state,
      reason,
      updateState: UPDATE_AVAILABLE,
      requiredVersion
    });
  }

  function requireUpdate({
    requiredVersion,
    reason = "magic_cursor_update_required"
  } = {}) {
    if (!requiredVersion) throw new Error("requiredVersion is required.");

    return setAccess({
      state: access.state,
      reason,
      updateState: UPDATE_REQUIRED,
      requiredVersion
    });
  }

  function markCurrent({
    currentVersion = access.required_version,
    reason = "magic_cursor_update_current"
  } = {}) {
    return setAccess({
      state: access.state,
      reason,
      updateState: UPDATE_CURRENT,
      currentVersion,
      requiredVersion: currentVersion
    });
  }

  function membershipAllowsAccess() {
    if (access.state === STATE_ACTIVE) return true;

    if (access.state === STATE_TRIAL && access.expires_at) {
      return new Date(access.expires_at).getTime() > Date.now();
    }

    return false;
  }

  function updateAllowsAccess() {
    return access.update_state !== UPDATE_REQUIRED;
  }

  function isAllowed() {
    return membershipAllowsAccess() && updateAllowsAccess();
  }

  function requireAccess() {
    if (!membershipAllowsAccess()) {
      throw new Error("Magic Cursor unavailable: membership is not active.");
    }

    if (!updateAllowsAccess()) {
      throw new Error("Magic Cursor unavailable: update is required.");
    }

    return true;
  }

  function getAccess() {
    return clone(access);
  }

  return {
    activateMembership,
    startTrial,
    lock,
    expire,
    setUpdateAvailable,
    requireUpdate,
    markCurrent,
    membershipAllowsAccess,
    updateAllowsAccess,
    isAllowed,
    requireAccess,
    getAccess
  };
})();

if (typeof window !== "undefined") {
  window.MagicCursorExtensionGate = MagicCursorExtensionGate;
}

export default MagicCursorExtensionGate;
