// c-s-i-and-g-net-cycle-witness-ledger-bridge.js
// CyberCrowd — NET Cycle Witness Ledger Bridge
//
// Owns:
// - receiving dispatched Smart Ring / Phone Edge adapter results
// - sending preserved adapter signals into the NET Witness Signal Ledger
// - preserving the closed-cycle adapter → witness trail
// - blocking 000, sensitive, private, token, session, health, biometric, raw sensor, and location material
// - keeping witness context separate from authority
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

const CyberCrowdNetCycleWitnessLedgerBridge = (() => {
  const ACCEPTED_DISPATCH_STATUS = "net_cycle_adapter_dispatched_no_external_call";

  const ACCEPTED_ADAPTER_SIGNAL_STATUSES = [
    "smart_ring_signal_preserved_no_external_call",
    "phone_edge_signal_preserved_no_external_call"
  ];

  const ACCEPTED_WITNESS_STATUS = "net_witness_signal_preserved_no_authority";

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
    bridged: [],
    held: [],
    rejected: []
  };

  let NetCycleAdapterDispatcher = null;
  let WitnessSignalLedger = null;

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
    NetCycleAdapterDispatcher =
      deps.NetCycleAdapterDispatcher ||
      deps.netCycleAdapterDispatcher ||
      deps.cycleAdapterDispatcher ||
      NetCycleAdapterDispatcher ||
      safeRequire("./c-s-i-and-g-net-cycle-adapter-dispatcher.js") ||
      null;

    WitnessSignalLedger =
      deps.WitnessSignalLedger ||
      deps.witnessSignalLedger ||
      deps.witnessLedger ||
      WitnessSignalLedger ||
      safeRequire("./c-s-i-and-g-net-witness-signal-ledger.js") ||
      null;

    state.configured = Boolean(NetCycleAdapterDispatcher && WitnessSignalLedger);

    return {
      configured: state.configured,
      has_net_cycle_adapter_dispatcher: Boolean(NetCycleAdapterDispatcher),
      has_witness_signal_ledger: Boolean(WitnessSignalLedger)
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
      id: makeId("cycleWitnessBridgeHold"),
      held_at: now(),
      reason,
      target: clone(target),
      witness_bridged: false,
      witness_preserved: false,
      authority_allowed: false,
      external_call_allowed: false,
      executed: false,
      status: "held_by_net_cycle_witness_ledger_bridge"
    };

    state.held.push(record);
    return record;
  }

  function reject(target, reason) {
    const record = {
      id: makeId("cycleWitnessBridgeReject"),
      rejected_at: now(),
      reason,
      target: clone(target),
      witness_bridged: false,
      witness_preserved: false,
      authority_allowed: false,
      external_call_allowed: false,
      executed: false,
      status: "rejected_by_net_cycle_witness_ledger_bridge"
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
      id: makeId("cycleWitnessBridgeReceive"),
      received_at: now(),
      input: clone(input),
      witness_bridged: false,
      witness_preserved: false,
      authority_allowed: false,
      external_call_allowed: false,
      executed: false,
      status: "received_by_net_cycle_witness_ledger_bridge"
    };

    state.received.push(record);
    return record;
  }

  function isDispatchRecord(input = {}) {
    if (!input || typeof input !== "object") {
      return false;
    }

    if (
      NetCycleAdapterDispatcher &&
      typeof NetCycleAdapterDispatcher.canEnterWitnessLedger === "function"
    ) {
      return NetCycleAdapterDispatcher.canEnterWitnessLedger(input);
    }

    return (
      input.status === ACCEPTED_DISPATCH_STATUS &&
      input.adapter_dispatched === true &&
      input.adapter_signal_preserved === true &&
      input.authority_allowed === false &&
      input.external_call_allowed === false &&
      input.executed === false &&
      input.adapter_result &&
      ACCEPTED_ADAPTER_SIGNAL_STATUSES.includes(input.adapter_result.status)
    );
  }

  function readAdapterSignal(input = {}) {
    if (!input || typeof input !== "object") {
      return null;
    }

    if (ACCEPTED_ADAPTER_SIGNAL_STATUSES.includes(input.status)) {
      return input;
    }

    if (
      input.adapter_result &&
      ACCEPTED_ADAPTER_SIGNAL_STATUSES.includes(input.adapter_result.status)
    ) {
      return input.adapter_result;
    }

    if (
      NetCycleAdapterDispatcher &&
      typeof NetCycleAdapterDispatcher.readAdapterResult === "function"
    ) {
      return NetCycleAdapterDispatcher.readAdapterResult(input);
    }

    return null;
  }

  function witnessLooksPreserved(result = {}) {
    return Boolean(
      result &&
      typeof result === "object" &&
      result.status === ACCEPTED_WITNESS_STATUS &&
      result.witness_preserved === true &&
      result.authority_allowed === false &&
      result.external_call_allowed === false &&
      result.executed === false
    );
  }

  function bridgeToWitnessLedger(input = {}, reason = "CYCLE_ADAPTER_SIGNAL_TO_WITNESS_LEDGER") {
    configure();

    const received = recordReceived(input);

    if (!input || typeof input !== "object") {
      return reject(
        {
          received,
          input
        },
        "INVALID_CYCLE_WITNESS_BRIDGE_INPUT"
      );
    }

    if (containsBlockedMaterial(input)) {
      return hold(
        {
          received,
          input
        },
        "CYCLE_WITNESS_BRIDGE_BLOCKED_SENSITIVE_OR_000_MATERIAL"
      );
    }

    if (!isDispatchRecord(input)) {
      return hold(
        {
          received,
          input
        },
        "CYCLE_WITNESS_BRIDGE_REQUIRES_DISPATCH_RECORD"
      );
    }

    const adapterSignal = readAdapterSignal(input);

    if (!adapterSignal) {
      return hold(
        {
          received,
          input
        },
        "CYCLE_WITNESS_BRIDGE_MISSING_ADAPTER_SIGNAL"
      );
    }

    if (!WitnessSignalLedger || typeof WitnessSignalLedger.receive !== "function") {
      return hold(
        {
          received,
          input,
          adapterSignal
        },
        "WITNESS_SIGNAL_LEDGER_NOT_AVAILABLE"
      );
    }

    const witnessResult = WitnessSignalLedger.receive({
      ...clone(adapterSignal),
      source: "net_cycle_witness_ledger_bridge",
      reason,
      dispatch_record_id: input.id || null
    });

    if (!witnessLooksPreserved(witnessResult)) {
      return hold(
        {
          received,
          input,
          adapterSignal,
          witnessResult
        },
        "WITNESS_SIGNAL_LEDGER_DID_NOT_PRESERVE_SIGNAL"
      );
    }

    const bridged = {
      id: makeId("cycleWitnessBridge"),
      bridged_at: now(),
      received_id: received.id,
      dispatch_record_id: input.id || null,
      adapter_signal_id: adapterSignal.id || null,
      adapter_id: adapterSignal.adapter_id || input.adapter_id || null,
      adapter_signal: clone(adapterSignal),
      witness_result: clone(witnessResult),
      witness_bridged: true,
      witness_preserved: true,
      authority_allowed: false,
      external_call_allowed: false,
      executed: false,
      status: "net_cycle_adapter_signal_bridged_to_witness_ledger"
    };

    state.bridged.push(bridged);
    return bridged;
  }

  function receiveFromDispatcher(input = {}, options = {}) {
    configure(options.deps || {});

    if (isDispatchRecord(input)) {
      return bridgeToWitnessLedger(
        input,
        options.reason || "DISPATCHED_ADAPTER_SIGNAL_TO_WITNESS_LEDGER"
      );
    }

    if (
      !NetCycleAdapterDispatcher ||
      typeof NetCycleAdapterDispatcher.receiveAndDispatch !== "function"
    ) {
      return hold(input, "NET_CYCLE_ADAPTER_DISPATCHER_NOT_AVAILABLE");
    }

    const dispatched = NetCycleAdapterDispatcher.receiveAndDispatch(
      input,
      options.adapter_id || options.adapterId,
      options
    );

    if (!isDispatchRecord(dispatched)) {
      return hold(
        {
          input,
          dispatched
        },
        "NET_CYCLE_ADAPTER_DISPATCHER_DID_NOT_CREATE_DISPATCH_RECORD"
      );
    }

    return bridgeToWitnessLedger(
      dispatched,
      options.reason || "DISPATCHER_OUTPUT_TO_WITNESS_LEDGER"
    );
  }

  function canEnterWitnessDeweyBridge(result = {}) {
    return Boolean(
      result &&
      typeof result === "object" &&
      result.status === "net_cycle_adapter_signal_bridged_to_witness_ledger" &&
      result.witness_bridged === true &&
      result.witness_preserved === true &&
      result.authority_allowed === false &&
      result.external_call_allowed === false &&
      result.executed === false &&
      result.witness_result &&
      result.witness_result.status === ACCEPTED_WITNESS_STATUS
    );
  }

  function readWitnessResult(result = {}) {
    if (!canEnterWitnessDeweyBridge(result)) {
      return null;
    }

    return clone(result.witness_result);
  }

  function peekBridged() {
    return clone(state.bridged);
  }

  function pullNextBridged() {
    const next = state.bridged.shift();

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
    bridgeToWitnessLedger,
    receiveFromDispatcher,
    isDispatchRecord,
    readAdapterSignal,
    witnessLooksPreserved,
    containsBlockedMaterial,
    canEnterWitnessDeweyBridge,
    readWitnessResult,
    peekBridged,
    pullNextBridged,
    canExecuteAuthority,
    canCallExternal,
    hold,
    reject,
    getState
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = CyberCrowdNetCycleWitnessLedgerBridge;
}
