// c-s-i-and-g-net-smart-ring-adapter.js
// CyberCrowd — NET Smart Ring Adapter
//
// Owns:
// - registering Smart Ring as a future NET adapter slot
// - receiving sanitized NET adapter shelf assignments
// - preserving wearable presence / gesture / witness intent signals
// - separating device signal from identity authority
// - blocking health, biometric, private, token, and session material
// - holding smart ring records without external device calls
//
// Does NOT own:
// - Bluetooth
// - NFC
// - real smart ring APIs
// - health data collection
// - biometric identity creation
// - OAuth
// - external API calls
// - scraping
// - webhook delivery
// - payment
// - sessions
// - cookies
// - KV storage
// - UI
// - real-world execution
// - authority execution

const CyberCrowdNetSmartRingAdapter = (() => {
  const ADAPTER_ID = "smart_ring_adapter";
  const ADAPTER_NAME = "Smart Ring Adapter";
  const ADAPTER_KIND = "wearable_presence_adapter";

  const ACCEPTED_ASSIGNMENT_STATUS = "assigned_to_net_adapter_shelf_no_external_call";

  const BLOCKED_MARKERS = [
    "heart rate",
    "heartrate",
    "blood oxygen",
    "spo2",
    "temperature",
    "sleep",
    "health",
    "medical",
    "biometric",
    "fingerprint",
    "dna",
    "private_id",
    "private id",
    "private_identity",
    "private identity",
    "protected_identity",
    "protected identity",
    "secret",
    "password",
    "token",
    "session",
    "cookie",
    "kv"
  ];

  const state = {
    configured: false,
    registered: false,
    received: [],
    held: [],
    rejected: [],
    preservedSignals: []
  };

  let NetAdapterShelf = null;

  function now() {
    return new Date().toISOString();
  }

  function clone(value) {
    if (value === undefined) {
      return undefined;
    }

    try {
      return JSON.parse(JSON.stringify(value));
    } catch (error) {
      return String(value);
    }
  }

  function makeId(prefix) {
    return `${prefix}.${Date.now()}.${Math.random().toString(36).slice(2, 10)}`;
  }

  function safeRequire(path) {
    if (typeof require === "undefined") {
      return null;
    }

    try {
      return require(path);
    } catch (error) {
      return null;
    }
  }

  function configure(deps = {}) {
    NetAdapterShelf =
      deps.NetAdapterShelf ||
      deps.netAdapterShelf ||
      deps.adapterShelf ||
      NetAdapterShelf ||
      safeRequire("./c-s-i-and-g-net-adapter-shelf.js") ||
      null;

    state.configured = Boolean(NetAdapterShelf);

    return {
      configured: state.configured,
      has_net_adapter_shelf: Boolean(NetAdapterShelf)
    };
  }

  function toText(value) {
    if (value === null || value === undefined) {
      return "";
    }

    if (typeof value === "string") {
      return value.toLowerCase();
    }

    try {
      return JSON.stringify(value).toLowerCase();
    } catch (error) {
      return String(value).toLowerCase();
    }
  }

  function hold(target, reason) {
    const record = {
      id: makeId("smartRingHold"),
      held_at: now(),
      adapter_id: ADAPTER_ID,
      reason,
      target: clone(target),
      device_signal_preserved: false,
      external_call_allowed: false,
      authority_allowed: false,
      executed: false,
      status: "held_by_smart_ring_adapter"
    };

    state.held.push(record);
    return record;
  }

  function reject(target, reason) {
    const record = {
      id: makeId("smartRingReject"),
      rejected_at: now(),
      adapter_id: ADAPTER_ID,
      reason,
      target: clone(target),
      device_signal_preserved: false,
      external_call_allowed: false,
      authority_allowed: false,
      executed: false,
      status: "rejected_by_smart_ring_adapter"
    };

    state.rejected.push(record);
    return record;
  }

  function registerOnShelf() {
    configure();

    if (!NetAdapterShelf || typeof NetAdapterShelf.registerAdapter !== "function") {
      return hold(null, "NET_ADAPTER_SHELF_NOT_AVAILABLE");
    }

    const registration = NetAdapterShelf.registerAdapter({
      adapter_id: ADAPTER_ID,
      name: ADAPTER_NAME,
      kind: ADAPTER_KIND,
      description: "Future Smart Ring wearable presence / gesture / witness adapter slot. No device calls.",
      accepts: [
        "wearable_presence_signal",
        "gesture_intent_signal",
        "witness_presence_signal",
        "net_receiver_accepted_record"
      ],
      enabled: true,
      ready: true,
      notes: [
        "No Bluetooth",
        "No NFC",
        "No health collection",
        "No biometric identity creation",
        "No external calls"
      ]
    });

    if (
      registration &&
      typeof registration === "object" &&
      registration.status === "net_adapter_registered_on_shelf"
    ) {
      state.registered = true;
    }

    return registration;
  }

  function ensureRegistered() {
    configure();

    if (!NetAdapterShelf) {
      return hold(null, "NET_ADAPTER_SHELF_NOT_AVAILABLE");
    }

    if (
      NetAdapterShelf.getAdapter &&
      NetAdapterShelf.getAdapter(ADAPTER_ID)
    ) {
      state.registered = true;
      return {
        id: makeId("smartRingAlreadyRegistered"),
        checked_at: now(),
        adapter_id: ADAPTER_ID,
        registered: true,
        status: "smart_ring_adapter_already_registered"
      };
    }

    return registerOnShelf();
  }

  function containsBlockedMaterial(input) {
    const text = toText(input);
    return BLOCKED_MARKERS.some((marker) => text.includes(marker));
  }

  function isShelfAssignment(input = {}) {
    if (!input || typeof input !== "object") {
      return false;
    }

    return (
      input.status === ACCEPTED_ASSIGNMENT_STATUS &&
      input.adapter_id === ADAPTER_ID &&
      input.adapter_ready === true &&
      input.net_ready === true &&
      input.authority_allowed === true &&
      input.release_allowed === true &&
      input.certificate_valid === true &&
      input.external_call_allowed === false &&
      input.executed === false
    );
  }

  function normalizePresenceSignal(input = {}) {
    return {
      id: makeId("smartRingSignal"),
      normalized_at: now(),
      adapter_id: ADAPTER_ID,
      adapter_name: ADAPTER_NAME,
      signal_type: "wearable_presence_gesture_witness_intent",
      source_assignment_id: input.id || null,
      source_receiver_id:
        input.receiver_record && input.receiver_record.id ||
        input.receiver_record && input.receiver_record.received_id ||
        null,
      payload: clone(input),
      allowed_uses: [
        "presence_hint",
        "gesture_intent_hint",
        "witness_context_hint"
      ],
      blocked_uses: [
        "biometric_identity_creation",
        "health_data_collection",
        "private_identity_exposure",
        "authority_execution",
        "external_device_call"
      ],
      device_signal_preserved: true,
      external_call_allowed: false,
      authority_allowed: false,
      executed: false,
      status: "smart_ring_signal_preserved_no_external_call"
    };
  }

  function receiveAssignment(input = {}) {
    ensureRegistered();

    const received = {
      id: makeId("smartRingReceive"),
      received_at: now(),
      adapter_id: ADAPTER_ID,
      input: clone(input),
      device_signal_preserved: false,
      external_call_allowed: false,
      authority_allowed: false,
      executed: false,
      status: "smart_ring_assignment_received"
    };

    state.received.push(received);

    if (!isShelfAssignment(input)) {
      return hold(
        {
          received,
          input
        },
        "SMART_RING_REQUIRES_ADAPTER_SHELF_ASSIGNMENT"
      );
    }

    if (containsBlockedMaterial(input)) {
      return hold(
        {
          received,
          input
        },
        "SMART_RING_BLOCKED_PRIVATE_HEALTH_BIOMETRIC_OR_TOKEN_MATERIAL"
      );
    }

    const signal = normalizePresenceSignal(input);
    state.preservedSignals.push(signal);

    return signal;
  }

  function pullFromShelf() {
    ensureRegistered();

    if (
      !NetAdapterShelf ||
      typeof NetAdapterShelf.pullAdapterAssignment !== "function"
    ) {
      return hold(null, "NET_ADAPTER_SHELF_PULL_NOT_AVAILABLE");
    }

    const assignment = NetAdapterShelf.pullAdapterAssignment(ADAPTER_ID);

    if (!assignment) {
      return hold(null, "SMART_RING_ADAPTER_INBOX_EMPTY");
    }

    return receiveAssignment(assignment);
  }

  function canCallDevice(result) {
    return false;
  }

  function canExecuteAuthority(result) {
    return false;
  }

  function getState() {
    return clone(state);
  }

  return {
    ADAPTER_ID,
    ADAPTER_NAME,
    ADAPTER_KIND,
    configure,
    registerOnShelf,
    ensureRegistered,
    receiveAssignment,
    pullFromShelf,
    normalizePresenceSignal,
    containsBlockedMaterial,
    isShelfAssignment,
    canCallDevice,
    canExecuteAuthority,
    hold,
    reject,
    getState
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = CyberCrowdNetSmartRingAdapter;
}
