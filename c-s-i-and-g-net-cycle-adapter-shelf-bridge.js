// c-s-i-and-g-net-cycle-adapter-shelf-bridge.js
// CyberCrowd — NET Cycle Adapter Shelf Bridge
//
// Owns:
// - receiving NET Cycle Receiver accepted records
// - pulling accepted receiver records into the NET Adapter Shelf
// - assigning closed-cycle records to registered adapter shelf slots
// - preserving Core → NET → Adapter Shelf trail without provider execution
// - blocking 000, sensitive, private, token, session, health, biometric, raw sensor, and location material
//
// Does NOT own:
// - provider adapters
// - OAuth
// - credential storage
// - external API calls
// - webhook delivery
// - scraping
// - payment
// - sessions
// - cookies
// - KV storage
// - UI
// - real-world execution
// - authority execution

const CyberCrowdNetCycleAdapterShelfBridge = (() => {
  const ACCEPTED_CYCLE_RECEIVER_STATUS = "net_cycle_received_by_receiver_no_external_call";
  const ACCEPTED_RECEIVER_STATUS = "net_receiver_accepted_no_external_call";
  const ACCEPTED_ASSIGNMENT_STATUS = "assigned_to_net_adapter_shelf_no_external_call";

  const BLOCKED_MARKERS = [
    "000_future_sci_fi_unclassified",
    "null horizon",
    "preserved_in_000",
    "unclassified_signal_routed_to_000",
    "private_id",
    "private id",
    "private_identity",
    "private identity",
    "protected_identity",
    "protected identity",
    "internal_identity",
    "internal identity",
    "secret",
    "password",
    "token",
    "access_token",
    "refresh_token",
    "authorization",
    "bearer",
    "session",
    "cookie",
    "kv",
    "heart rate",
    "blood oxygen",
    "spo2",
    "sleep",
    "medical",
    "health",
    "biometric",
    "fingerprint",
    "face id",
    "dna",
    "gps",
    "precise location",
    "exact location",
    "latitude",
    "longitude",
    "raw_camera",
    "raw camera",
    "raw_microphone",
    "raw microphone",
    "camera stream",
    "microphone stream"
  ];

  const state = {
    configured: false,
    received: [],
    assignments: [],
    held: [],
    rejected: []
  };

  let NetCycleReceiverBridge = null;
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
    NetCycleReceiverBridge =
      deps.NetCycleReceiverBridge ||
      deps.netCycleReceiverBridge ||
      deps.cycleReceiverBridge ||
      NetCycleReceiverBridge ||
      safeRequire("./c-s-i-and-g-net-cycle-receiver-bridge.js") ||
      null;

    NetAdapterShelf =
      deps.NetAdapterShelf ||
      deps.netAdapterShelf ||
      deps.adapterShelf ||
      NetAdapterShelf ||
      safeRequire("./c-s-i-and-g-net-adapter-shelf.js") ||
      null;

    state.configured = Boolean(NetCycleReceiverBridge && NetAdapterShelf);

    return {
      configured: state.configured,
      has_net_cycle_receiver_bridge: Boolean(NetCycleReceiverBridge),
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
      id: makeId("cycleAdapterShelfHold"),
      held_at: now(),
      reason,
      target: clone(target),
      adapter_assigned: false,
      net_ready: false,
      authority_allowed: false,
      release_allowed: false,
      certificate_valid: false,
      external_call_allowed: false,
      executed: false,
      status: "held_by_net_cycle_adapter_shelf_bridge"
    };

    state.held.push(record);
    return record;
  }

  function reject(target, reason) {
    const record = {
      id: makeId("cycleAdapterShelfReject"),
      rejected_at: now(),
      reason,
      target: clone(target),
      adapter_assigned: false,
      net_ready: false,
      authority_allowed: false,
      release_allowed: false,
      certificate_valid: false,
      external_call_allowed: false,
      executed: false,
      status: "rejected_by_net_cycle_adapter_shelf_bridge"
    };

    state.rejected.push(record);
    return record;
  }

  function containsBlockedMaterial(input) {
    const text = toText(input);

    return BLOCKED_MARKERS.some((marker) => {
      return text.includes(marker);
    });
  }

  function recordReceived(input = {}) {
    const record = {
      id: makeId("cycleAdapterShelfReceive"),
      received_at: now(),
      input: clone(input),
      adapter_assigned: false,
      net_ready: false,
      authority_allowed: false,
      release_allowed: false,
      certificate_valid: false,
      external_call_allowed: false,
      executed: false,
      status: "received_by_net_cycle_adapter_shelf_bridge"
    };

    state.received.push(record);
    return record;
  }

  function isCycleReceiverRecord(input = {}) {
    if (!input || typeof input !== "object") {
      return false;
    }

    if (
      NetCycleReceiverBridge &&
      typeof NetCycleReceiverBridge.canEnterAdapterShelf === "function"
    ) {
      return NetCycleReceiverBridge.canEnterAdapterShelf(input);
    }

    return (
      input.status === ACCEPTED_CYCLE_RECEIVER_STATUS &&
      input.net_received === true &&
      input.net_ready === true &&
      input.authority_allowed === true &&
      input.release_allowed === true &&
      input.certificate_valid === true &&
      input.external_call_allowed === false &&
      input.executed === false &&
      input.receiver_result &&
      input.receiver_result.status === ACCEPTED_RECEIVER_STATUS
    );
  }

  function readReceiverRecord(input = {}) {
    if (!input || typeof input !== "object") {
      return null;
    }

    if (input.status === ACCEPTED_RECEIVER_STATUS) {
      return input;
    }

    if (
      input.receiver_result &&
      input.receiver_result.status === ACCEPTED_RECEIVER_STATUS
    ) {
      return input.receiver_result;
    }

    if (
      NetCycleReceiverBridge &&
      typeof NetCycleReceiverBridge.readReceiverResult === "function"
    ) {
      return NetCycleReceiverBridge.readReceiverResult(input);
    }

    return null;
  }

  function assignmentLooksReady(result = {}) {
    return Boolean(
      result &&
      typeof result === "object" &&
      result.status === ACCEPTED_ASSIGNMENT_STATUS &&
      result.adapter_ready === true &&
      result.net_ready === true &&
      result.authority_allowed === true &&
      result.release_allowed === true &&
      result.certificate_valid === true &&
      result.external_call_allowed === false &&
      result.executed === false
    );
  }

  function assignToAdapter(input = {}, adapterId, reason = "NET_CYCLE_RECEIVER_TO_ADAPTER_SHELF") {
    configure();

    const received = recordReceived(input);

    if (!input || typeof input !== "object") {
      return reject(
        {
          received,
          input,
          adapterId
        },
        "INVALID_NET_CYCLE_ADAPTER_SHELF_INPUT"
      );
    }

    if (containsBlockedMaterial(input)) {
      return hold(
        {
          received,
          input,
          adapterId
        },
        "NET_CYCLE_ADAPTER_SHELF_BLOCKED_SENSITIVE_OR_000_MATERIAL"
      );
    }

    if (!adapterId) {
      return hold(
        {
          received,
          input
        },
        "NET_CYCLE_ADAPTER_SHELF_REQUIRES_ADAPTER_ID"
      );
    }

    if (!isCycleReceiverRecord(input)) {
      return hold(
        {
          received,
          input,
          adapterId
        },
        "NET_CYCLE_ADAPTER_SHELF_REQUIRES_CYCLE_RECEIVER_RECORD"
      );
    }

    const receiverRecord = readReceiverRecord(input);

    if (!receiverRecord) {
      return hold(
        {
          received,
          input,
          adapterId
        },
        "NET_CYCLE_ADAPTER_SHELF_MISSING_RECEIVER_RECORD"
      );
    }

    if (!NetAdapterShelf || typeof NetAdapterShelf.assignToAdapter !== "function") {
      return hold(
        {
          received,
          input,
          receiverRecord,
          adapterId
        },
        "NET_ADAPTER_SHELF_NOT_AVAILABLE"
      );
    }

    const assignment = NetAdapterShelf.assignToAdapter(adapterId, receiverRecord);

    if (!assignmentLooksReady(assignment)) {
      return hold(
        {
          received,
          input,
          receiverRecord,
          adapterId,
          assignment
        },
        "NET_ADAPTER_SHELF_DID_NOT_ASSIGN_CYCLE_RECORD"
      );
    }

    const record = {
      id: makeId("cycleAdapterShelfAssignment"),
      assigned_at: now(),
      received_id: received.id,
      cycle_receiver_id: input.id || null,
      receiver_record_id: receiverRecord.id || null,
      adapter_id: adapterId,
      reason,
      receiver_record: clone(receiverRecord),
      assignment: clone(assignment),
      adapter_assigned: true,
      net_ready: true,
      authority_allowed: true,
      release_allowed: true,
      certificate_valid: true,
      external_call_allowed: false,
      executed: false,
      status: "net_cycle_assigned_to_adapter_shelf_no_external_call"
    };

    state.assignments.push(record);
    return record;
  }

  function receiveAndAssign(cycleRecord = {}, adapterId, options = {}) {
    configure(options.deps || {});

    if (isCycleReceiverRecord(cycleRecord)) {
      return assignToAdapter(
        cycleRecord,
        adapterId,
        options.reason || "CYCLE_RECORD_ASSIGNED_TO_ADAPTER_SHELF"
      );
    }

    if (
      !NetCycleReceiverBridge ||
      typeof NetCycleReceiverBridge.receive !== "function"
    ) {
      return hold(cycleRecord, "NET_CYCLE_RECEIVER_BRIDGE_NOT_AVAILABLE");
    }

    const received = NetCycleReceiverBridge.receive(cycleRecord, options);

    if (!isCycleReceiverRecord(received)) {
      return hold(
        {
          cycleRecord,
          received
        },
        "NET_CYCLE_RECEIVER_BRIDGE_DID_NOT_CREATE_ASSIGNABLE_RECORD"
      );
    }

    return assignToAdapter(
      received,
      adapterId,
      options.reason || "RECEIVED_CYCLE_RECORD_ASSIGNED_TO_ADAPTER_SHELF"
    );
  }

  function canEnterAdapter(result = {}) {
    return Boolean(
      result &&
      typeof result === "object" &&
      result.status === "net_cycle_assigned_to_adapter_shelf_no_external_call" &&
      result.adapter_assigned === true &&
      result.net_ready === true &&
      result.authority_allowed === true &&
      result.release_allowed === true &&
      result.certificate_valid === true &&
      result.external_call_allowed === false &&
      result.executed === false &&
      result.assignment &&
      result.assignment.status === ACCEPTED_ASSIGNMENT_STATUS
    );
  }

  function readAssignment(result = {}) {
    if (!canEnterAdapter(result)) {
      return null;
    }

    return clone(result.assignment);
  }

  function peekAssignments() {
    return clone(state.assignments);
  }

  function pullNextAssignment() {
    const next = state.assignments.shift();

    if (!next) {
      return null;
    }

    return clone(next);
  }

  function canExecuteAuthority() {
    return false;
  }

  function canCallExternal() {
    return false;
  }

  function getState() {
    return clone(state);
  }

  return {
    configure,
    assignToAdapter,
    receiveAndAssign,
    isCycleReceiverRecord,
    readReceiverRecord,
    assignmentLooksReady,
    containsBlockedMaterial,
    canEnterAdapter,
    readAssignment,
    peekAssignments,
    pullNextAssignment,
    canExecuteAuthority,
    canCallExternal,
    hold,
    reject,
    getState
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = CyberCrowdNetCycleAdapterShelfBridge;
}
