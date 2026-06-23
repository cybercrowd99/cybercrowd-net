// magic-cursor-pairing.js
// CyberCrowd Magic Cursor — Pairing / Initial Bond Core
// Owns: first-bond enrollment state, cable-required pairing,
// trusted device records, pairing approval, revoke, and lookup.
// Wireless operation may come after trust. Initial trust requires physical bond.
// Does not transport events, move cursor, access clipboard, or grant OS control.

const MagicCursorPairing = (() => {
  const STATUS_UNPAIRED = "unpaired";
  const STATUS_PENDING_CABLE = "pending_cable";
  const STATUS_BONDED = "bonded";
  const STATUS_REVOKED = "revoked";
  const STATUS_BLOCKED = "blocked";

  let devices = {};

  function now() {
    return new Date().toISOString();
  }

  function makeId(prefix) {
    return `${prefix}.${Date.now()}.${Math.random().toString(36).slice(2, 10)}`;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function requireDevice(deviceId) {
    if (!deviceId || !devices[deviceId]) {
      throw new Error("Unknown Magic Cursor paired device.");
    }

    return devices[deviceId];
  }

  function startPairing({
    deviceId = makeId("mcDevice"),
    label = "Dormant Device",
    deviceType = "unknown",
    requestedRole = "assigned_surface",
    cableConnected = false,
    operatorId = null,
    metadata = {}
  } = {}) {
    if (devices[deviceId] && devices[deviceId].status === STATUS_BONDED) {
      throw new Error("Device is already bonded.");
    }

    const status = cableConnected ? STATUS_BONDED : STATUS_PENDING_CABLE;

    const record = {
      device_id: deviceId,
      label,
      device_type: deviceType,
      requested_role: requestedRole,
      status,
      first_bond_required: true,
      cable_connected_at: cableConnected ? now() : null,
      bonded_at: cableConnected ? now() : null,
      revoked_at: null,
      operator_id: operatorId,
      trust_id: cableConnected ? makeId("mcTrust") : null,
      created_at: now(),
      updated_at: now(),
      metadata
    };

    devices[deviceId] = record;
    return clone(record);
  }

  function completeCableBond(deviceId, {
    operatorId = null,
    reason = "physical_cable_bond_complete"
  } = {}) {
    const device = requireDevice(deviceId);

    if (device.status === STATUS_REVOKED || device.status === STATUS_BLOCKED) {
      throw new Error("Cannot bond a revoked or blocked device.");
    }

    device.status = STATUS_BONDED;
    device.operator_id = operatorId || device.operator_id;
    device.cable_connected_at = device.cable_connected_at || now();
    device.bonded_at = now();
    device.trust_id = device.trust_id || makeId("mcTrust");
    device.metadata = {
      ...device.metadata,
      bond_reason: reason
    };
    device.updated_at = now();

    return clone(device);
  }

  function revoke(deviceId, reason = "manual_revoke") {
    const device = requireDevice(deviceId);

    device.status = STATUS_REVOKED;
    device.revoked_at = now();
    device.metadata = {
      ...device.metadata,
      revoke_reason: reason
    };
    device.updated_at = now();

    return clone(device);
  }

  function block(deviceId, reason = "manual_block") {
    const device = requireDevice(deviceId);

    device.status = STATUS_BLOCKED;
    device.metadata = {
      ...device.metadata,
      block_reason: reason
    };
    device.updated_at = now();

    return clone(device);
  }

  function isBonded(deviceId) {
    const device = requireDevice(deviceId);
    return device.status === STATUS_BONDED;
  }

  function requireBonded(deviceId) {
    if (!isBonded(deviceId)) {
      throw new Error("Magic Cursor device is not physically bonded.");
    }

    return true;
  }

  function canBecomeSurface(deviceId) {
    const device = requireDevice(deviceId);

    return {
      device_id: device.device_id,
      allowed: device.status === STATUS_BONDED,
      status: device.status,
      requested_role: device.requested_role,
      reason: device.status === STATUS_BONDED
        ? "device_bonded"
        : "initial_cable_bond_required"
    };
  }

  function getDevice(deviceId) {
    return clone(requireDevice(deviceId));
  }

  function getAllDevices() {
    return clone(Object.values(devices));
  }

  function clear(reason = "manual_clear") {
    const cleared = Object.keys(devices).length;
    devices = {};

    return {
      cleared,
      reason,
      timestamp: now()
    };
  }

  return {
    startPairing,
    completeCableBond,
    revoke,
    block,
    isBonded,
    requireBonded,
    canBecomeSurface,
    getDevice,
    getAllDevices,
    clear
  };
})();

if (typeof window !== "undefined") {
  window.MagicCursorPairing = MagicCursorPairing;
}

export default MagicCursorPairing;
