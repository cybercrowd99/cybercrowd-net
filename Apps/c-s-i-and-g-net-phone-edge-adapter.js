// c-s-i-and-g-net-phone-edge-adapter.js
// CyberCrowd — NET Phone Edge Adapter
//
// Owns:
// - registering obsolete / spare phones as future NET edge adapter slots
// - receiving sanitized NET adapter shelf assignments
// - preserving low-trust phone presence / heartbeat / witness intent signals
// - separating phone observation from identity authority
// - blocking raw camera, microphone, precise location, private, token, and session material
// - holding phone edge records without external device calls
//
// Does NOT own:
// - real phone APIs
// - camera activation
// - microphone activation
// - GPS / precise location collection
// - Bluetooth
// - NFC
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

const CyberCrowdNetPhoneEdgeAdapter = (() => {
  const ADAPTER_ID = "phone_edge_adapter";
  const ADAPTER_NAME = "Phone Edge Adapter";
  const ADAPTER_KIND = "low_trust_edge_presence_adapter";

  const ACCEPTED_ASSIGNMENT_STATUS = "assigned_to_net_adapter_shelf_no_external_call";

  const BLOCKED_MARKERS = [
    "raw_camera",
    "raw camera",
    "camera stream",
    "live camera",
    "microphone stream",
    "raw microphone",
    "raw_microphone",
    "gps",
    "precise location",
    "exact location",
    "coordinates",
    "latitude",
    "longitude",
    "biometric",
    "face id",
    "fingerprint",
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
      id: makeId("phoneEdgeHold"),
      held_at: now(),
      adapter_id: ADAPTER_ID,
      reason,
      target: clone(target),
      phone_signal_preserved: false,
      external_call_allowed: false,
      authority_allowed: false,
      executed: false,
      status: "held_by_phone_edge_adapter"
    };

    state.held.push(record);
    return record;
  }

  function reject(target, reason) {
    const record = {
      id: makeId("phoneEdgeReject"),
      rejected_at: now(),
      adapter_id: ADAPTER_ID,
      reason,
      target: clone(target),
      phone_signal_preserved: false,
      external_call_allowed: false,
      authority_allowed: false,
      executed: false,
      status: "rejected_by_phone_edge_adapter"
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
      description: "Future obsolete / spare phone edge presence, heartbeat, and witness intent adapter slot. No device calls.",
      accepts: [
        "phone_presence_signal",
        "edge_heartbeat_signal",
        "witness_intent_signal",
        "media_reference_hint",
        "net_receiver_accepted_record"
      ],
      enabled: true,
      ready: true,
      notes: [
        "No camera activation",
        "No microphone activation",
        "No GPS collection",
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
        id: makeId("phoneEdgeAlreadyRegistered"),
        checked_at: now(),
        adapter_id: ADAPTER_ID,
        registered: true,
        status: "phone_edge_adapter_already_registered"
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

  function normalizePhoneEdgeSignal(input = {}) {
    return {
      id: makeId("phoneEdgeSignal"),
      normalized_at: now(),
      adapter_id: ADAPTER_ID,
      adapter_name: ADAPTER_NAME,
      signal_type: "low_trust_phone_presence_heartbeat_witness_intent",
      source_assignment_id: input.id || null,
      source_receiver_id:
        input.receiver_record && input.receiver_record.id ||
        input.receiver_record && input.receiver_record.received_id ||
        null,
      payload: clone(input),
      allowed_uses: [
        "presence_hint",
        "edge_heartbeat_hint",
        "witness_context_hint",
        "media_reference_hint"
      ],
      blocked_uses: [
        "camera_activation",
        "microphone_activation",
        "gps_collection",
        "precise_location_tracking",
        "biometric_identity_creation",
        "private_identity_exposure",
        "authority_execution",
        "external_device_call"
      ],
      trust_level: "low_trust_observation_only",
      phone_signal_preserved: true,
      external_call_allowed: false,
      authority_allowed: false,
      executed: false,
      status: "phone_edge_signal_preserved_no_external_call"
    };
  }

  function receiveAssignment(input = {}) {
    ensureRegistered();

    const received = {
      id: makeId("phoneEdgeReceive"),
      received_at: now(),
      adapter_id: ADAPTER_ID,
      input: clone(input),
      phone_signal_preserved: false,
      external_call_allowed: false,
      authority_allowed: false,
      executed: false,
      status: "phone_edge_assignment_received"
    };

    state.received.push(received);

    if (!isShelfAssignment(input)) {
      return hold(
        {
          received,
          input
        },
        "PHONE_EDGE_REQUIRES_ADAPTER_SHELF_ASSIGNMENT"
      );
    }

    if (containsBlockedMaterial(input)) {
      return hold(
        {
          received,
          input
        },
        "PHONE_EDGE_BLOCKED_RAW_SENSOR_LOCATION_PRIVATE_OR_TOKEN_MATERIAL"
      );
    }

    const signal = normalizePhoneEdgeSignal(input);
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
      return hold(null, "PHONE_EDGE_ADAPTER_INBOX_EMPTY");
    }

    return receiveAssignment(assignment);
  }

  function canCallDevice() {
    return false;
  }

  function canExecuteAuthority() {
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
    normalizePhoneEdgeSignal,
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
  module.exports = CyberCrowdNetPhoneEdgeAdapter;
}
