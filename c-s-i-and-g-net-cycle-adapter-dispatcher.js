// c-s-i-and-g-net-cycle-adapter-dispatcher.js
// CyberCrowd — NET Cycle Adapter Dispatcher
//
// Owns:
// - receiving NET cycle adapter shelf assignments
// - dispatching assignments to known NET adapter modules
// - supporting Smart Ring and Phone Edge adapter handoff
// - preserving dispatch trail without device calls or provider execution
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

const CyberCrowdNetCycleAdapterDispatcher = (() => {
  const ACCEPTED_CYCLE_ASSIGNMENT_STATUS = "net_cycle_assigned_to_adapter_shelf_no_external_call";
  const ACCEPTED_SHELF_ASSIGNMENT_STATUS = "assigned_to_net_adapter_shelf_no_external_call";

  const KNOWN_ADAPTERS = {
    smart_ring_adapter: "smart_ring_adapter",
    phone_edge_adapter: "phone_edge_adapter"
  };

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
    dispatched: [],
    held: [],
    rejected: []
  };

  let NetCycleAdapterShelfBridge = null;
  let SmartRingAdapter = null;
  let PhoneEdgeAdapter = null;

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
    NetCycleAdapterShelfBridge =
      deps.NetCycleAdapterShelfBridge ||
      deps.netCycleAdapterShelfBridge ||
      deps.cycleAdapterShelfBridge ||
      NetCycleAdapterShelfBridge ||
      safeRequire("./c-s-i-and-g-net-cycle-adapter-shelf-bridge.js") ||
      null;

    SmartRingAdapter =
      deps.SmartRingAdapter ||
      deps.smartRingAdapter ||
      SmartRingAdapter ||
      safeRequire("./c-s-i-and-g-net-smart-ring-adapter.js") ||
      null;

    PhoneEdgeAdapter =
      deps.PhoneEdgeAdapter ||
      deps.phoneEdgeAdapter ||
      PhoneEdgeAdapter ||
      safeRequire("./c-s-i-and-g-net-phone-edge-adapter.js") ||
      null;

    state.configured = Boolean(
      NetCycleAdapterShelfBridge ||
      SmartRingAdapter ||
      PhoneEdgeAdapter
    );

    return {
      configured: state.configured,
      has_cycle_adapter_shelf_bridge: Boolean(NetCycleAdapterShelfBridge),
      has_smart_ring_adapter: Boolean(SmartRingAdapter),
      has_phone_edge_adapter: Boolean(PhoneEdgeAdapter)
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

  function cleanAdapterId(value) {
    const clean = String(value || "").trim();

    if (!clean) {
      return null;
    }

    return clean
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  function hold(target, reason) {
    const record = {
      id: makeId("cycleAdapterDispatchHold"),
      held_at: now(),
      reason,
      target: clone(target),
      adapter_dispatched: false,
      adapter_signal_preserved: false,
      authority_allowed: false,
      external_call_allowed: false,
      executed: false,
      status: "held_by_net_cycle_adapter_dispatcher"
    };

    state.held.push(record);
    return record;
  }

  function reject(target, reason) {
    const record = {
      id: makeId("cycleAdapterDispatchReject"),
      rejected_at: now(),
      reason,
      target: clone(target),
      adapter_dispatched: false,
      adapter_signal_preserved: false,
      authority_allowed: false,
      external_call_allowed: false,
      executed: false,
      status: "rejected_by_net_cycle_adapter_dispatcher"
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
      id: makeId("cycleAdapterDispatchReceive"),
      received_at: now(),
      input: clone(input),
      adapter_dispatched: false,
      adapter_signal_preserved: false,
      authority_allowed: false,
      external_call_allowed: false,
      executed: false,
      status: "received_by_net_cycle_adapter_dispatcher"
    };

    state.received.push(record);
    return record;
  }

  function isCycleAssignment(input = {}) {
    if (!input || typeof input !== "object") {
      return false;
    }

    if (
      NetCycleAdapterShelfBridge &&
      typeof NetCycleAdapterShelfBridge.canEnterAdapter === "function"
    ) {
      return NetCycleAdapterShelfBridge.canEnterAdapter(input);
    }

    return (
      input.status === ACCEPTED_CYCLE_ASSIGNMENT_STATUS &&
      input.adapter_assigned === true &&
      input.net_ready === true &&
      input.authority_allowed === true &&
      input.release_allowed === true &&
      input.certificate_valid === true &&
      input.external_call_allowed === false &&
      input.executed === false &&
      input.assignment &&
      input.assignment.status === ACCEPTED_SHELF_ASSIGNMENT_STATUS
    );
  }

  function readAssignment(input = {}) {
    if (!input || typeof input !== "object") {
      return null;
    }

    if (input.status === ACCEPTED_SHELF_ASSIGNMENT_STATUS) {
      return input;
    }

    if (
      input.assignment &&
      input.assignment.status === ACCEPTED_SHELF_ASSIGNMENT_STATUS
    ) {
      return input.assignment;
    }

    if (
      NetCycleAdapterShelfBridge &&
      typeof NetCycleAdapterShelfBridge.readAssignment === "function"
    ) {
      return NetCycleAdapterShelfBridge.readAssignment(input);
    }

    return null;
  }

  function readAdapterId(input = {}) {
    const assignment = readAssignment(input);

    return cleanAdapterId(
      input.adapter_id ||
      assignment && assignment.adapter_id ||
      assignment && assignment.adapter_name ||
      null
    );
  }

  function dispatchResultLooksPreserved(result = {}) {
    return Boolean(
      result &&
      typeof result === "object" &&
      (
        result.status === "smart_ring_signal_preserved_no_external_call" ||
        result.status === "phone_edge_signal_preserved_no_external_call"
      ) &&
      result.authority_allowed === false &&
      result.external_call_allowed === false &&
      result.executed === false
    );
  }

  function dispatchToKnownAdapter(assignment = {}, adapterId) {
    const cleanId = cleanAdapterId(adapterId);

    if (cleanId === KNOWN_ADAPTERS.smart_ring_adapter) {
      if (!SmartRingAdapter || typeof SmartRingAdapter.receiveAssignment !== "function") {
        return hold(
          {
            assignment,
            adapterId: cleanId
          },
          "SMART_RING_ADAPTER_NOT_AVAILABLE"
        );
      }

      return SmartRingAdapter.receiveAssignment(assignment);
    }

    if (cleanId === KNOWN_ADAPTERS.phone_edge_adapter) {
      if (!PhoneEdgeAdapter || typeof PhoneEdgeAdapter.receiveAssignment !== "function") {
        return hold(
          {
            assignment,
            adapterId: cleanId
          },
          "PHONE_EDGE_ADAPTER_NOT_AVAILABLE"
        );
      }

      return PhoneEdgeAdapter.receiveAssignment(assignment);
    }

    return hold(
      {
        assignment,
        adapterId: cleanId
      },
      "UNKNOWN_ADAPTER_FOR_CYCLE_DISPATCH"
    );
  }

  function dispatch(input = {}, options = {}) {
    configure(options.deps || {});

    const received = recordReceived(input);

    if (!input || typeof input !== "object") {
      return reject(
        {
          received,
          input
        },
        "INVALID_CYCLE_ADAPTER_DISPATCH_INPUT"
      );
    }

    if (containsBlockedMaterial(input)) {
      return hold(
        {
          received,
          input
        },
        "CYCLE_ADAPTER_DISPATCH_BLOCKED_SENSITIVE_OR_000_MATERIAL"
      );
    }

    if (!isCycleAssignment(input)) {
      return hold(
        {
          received,
          input
        },
        "CYCLE_ADAPTER_DISPATCH_REQUIRES_CYCLE_ASSIGNMENT"
      );
    }

    const assignment = readAssignment(input);

    if (!assignment) {
      return hold(
        {
          received,
          input
        },
        "CYCLE_ADAPTER_DISPATCH_MISSING_ASSIGNMENT"
      );
    }

    const adapterId = readAdapterId(input);

    if (!adapterId) {
      return hold(
        {
          received,
          input,
          assignment
        },
        "CYCLE_ADAPTER_DISPATCH_MISSING_ADAPTER_ID"
      );
    }

    const adapterResult = dispatchToKnownAdapter(assignment, adapterId);

    if (!dispatchResultLooksPreserved(adapterResult)) {
      return hold(
        {
          received,
          input,
          assignment,
          adapterId,
          adapterResult
        },
        "CYCLE_ADAPTER_DID_NOT_PRESERVE_SIGNAL"
      );
    }

    const dispatched = {
      id: makeId("cycleAdapterDispatch"),
      dispatched_at: now(),
      received_id: received.id,
      cycle_assignment_id: input.id || null,
      shelf_assignment_id: assignment.id || null,
      adapter_id: adapterId,
      assignment: clone(assignment),
      adapter_result: clone(adapterResult),
      adapter_dispatched: true,
      adapter_signal_preserved: true,
      authority_allowed: false,
      external_call_allowed: false,
      executed: false,
      status: "net_cycle_adapter_dispatched_no_external_call"
    };

    state.dispatched.push(dispatched);
    return dispatched;
  }

  function receiveAndDispatch(cycleRecord = {}, adapterId, options = {}) {
    configure(options.deps || {});

    if (isCycleAssignment(cycleRecord)) {
      return dispatch(cycleRecord, options);
    }

    if (
      !NetCycleAdapterShelfBridge ||
      typeof NetCycleAdapterShelfBridge.receiveAndAssign !== "function"
    ) {
      return hold(cycleRecord, "NET_CYCLE_ADAPTER_SHELF_BRIDGE_NOT_AVAILABLE");
    }

    const assignment = NetCycleAdapterShelfBridge.receiveAndAssign(cycleRecord, adapterId, options);

    if (!isCycleAssignment(assignment)) {
      return hold(
        {
          cycleRecord,
          adapterId,
          assignment
        },
        "CYCLE_ADAPTER_SHELF_BRIDGE_DID_NOT_CREATE_ASSIGNMENT"
      );
    }

    return dispatch(assignment, options);
  }

  function canEnterWitnessLedger(result = {}) {
    return Boolean(
      result &&
      typeof result === "object" &&
      result.status === "net_cycle_adapter_dispatched_no_external_call" &&
      result.adapter_dispatched === true &&
      result.adapter_signal_preserved === true &&
      result.authority_allowed === false &&
      result.external_call_allowed === false &&
      result.executed === false &&
      result.adapter_result &&
      (
        result.adapter_result.status === "smart_ring_signal_preserved_no_external_call" ||
        result.adapter_result.status === "phone_edge_signal_preserved_no_external_call"
      )
    );
  }

  function readAdapterResult(result = {}) {
    if (!canEnterWitnessLedger(result)) {
      return null;
    }

    return clone(result.adapter_result);
  }

  function peekDispatched() {
    return clone(state.dispatched);
  }

  function pullNextDispatched() {
    const next = state.dispatched.shift();

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
    KNOWN_ADAPTERS,
    configure,
    dispatch,
    receiveAndDispatch,
    dispatchToKnownAdapter,
    isCycleAssignment,
    readAssignment,
    readAdapterId,
    dispatchResultLooksPreserved,
    containsBlockedMaterial,
    canEnterWitnessLedger,
    readAdapterResult,
    peekDispatched,
    pullNextDispatched,
    canExecuteAuthority,
    canCallExternal,
    hold,
    reject,
    getState
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = CyberCrowdNetCycleAdapterDispatcher;
}
