// c-s-i-and-g-net-cycle-witness-dewey-return.js
// CyberCrowd — NET Cycle Witness Dewey Return
//
// Owns:
// - receiving closed-cycle witness ledger bridge records
// - sending preserved witness results into NET Witness to Dewey Bridge
// - creating candidate-only Dewey review packets from closed-cycle witness context
// - preserving witness → Dewey return trail without authority
// - blocking 000, sensitive, private, token, session, health, biometric, raw sensor, and location material
//
// Does NOT own:
// - final Dewey classification
// - authority execution
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
// - device calls
// - real-world execution

const CyberCrowdNetCycleWitnessDeweyReturn = (() => {
  const ACCEPTED_WITNESS_BRIDGE_STATUS = "net_cycle_adapter_signal_bridged_to_witness_ledger";
  const ACCEPTED_WITNESS_STATUS = "net_witness_signal_preserved_no_authority";

  const ACCEPTED_DEWEY_QUEUE_STATUS = "witness_context_queued_for_dewey_later";
  const ACCEPTED_DEWEY_PROCESS_STATUS = "witness_context_processed_for_dewey_later";

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
    returned: [],
    held: [],
    rejected: []
  };

  let NetCycleWitnessLedgerBridge = null;
  let WitnessDeweyBridge = null;

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
    NetCycleWitnessLedgerBridge =
      deps.NetCycleWitnessLedgerBridge ||
      deps.netCycleWitnessLedgerBridge ||
      deps.cycleWitnessLedgerBridge ||
      NetCycleWitnessLedgerBridge ||
      safeRequire("./c-s-i-and-g-net-cycle-witness-ledger-bridge.js") ||
      null;

    WitnessDeweyBridge =
      deps.WitnessDeweyBridge ||
      deps.witnessDeweyBridge ||
      deps.netWitnessDeweyBridge ||
      WitnessDeweyBridge ||
      safeRequire("./c-s-i-and-g-net-witness-dewey-bridge.js") ||
      null;

    state.configured = Boolean(
      NetCycleWitnessLedgerBridge &&
      WitnessDeweyBridge
    );

    return {
      configured: state.configured,
      has_net_cycle_witness_ledger_bridge: Boolean(NetCycleWitnessLedgerBridge),
      has_witness_dewey_bridge: Boolean(WitnessDeweyBridge)
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
      id: makeId("cycleWitnessDeweyReturnHold"),
      held_at: now(),
      reason,
      target: clone(target),
      dewey_return_ready: false,
      candidate_only: true,
      final_classification: false,
      authority_allowed: false,
      external_call_allowed: false,
      executed: false,
      status: "held_by_net_cycle_witness_dewey_return"
    };

    state.held.push(record);
    return record;
  }

  function reject(target, reason) {
    const record = {
      id: makeId("cycleWitnessDeweyReturnReject"),
      rejected_at: now(),
      reason,
      target: clone(target),
      dewey_return_ready: false,
      candidate_only: true,
      final_classification: false,
      authority_allowed: false,
      external_call_allowed: false,
      executed: false,
      status: "rejected_by_net_cycle_witness_dewey_return"
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
      id: makeId("cycleWitnessDeweyReturnReceive"),
      received_at: now(),
      input: clone(input),
      dewey_return_ready: false,
      candidate_only: true,
      final_classification: false,
      authority_allowed: false,
      external_call_allowed: false,
      executed: false,
      status: "received_by_net_cycle_witness_dewey_return"
    };

    state.received.push(record);
    return record;
  }

  function isWitnessBridgeRecord(input = {}) {
    if (!input || typeof input !== "object") {
      return false;
    }

    if (
      NetCycleWitnessLedgerBridge &&
      typeof NetCycleWitnessLedgerBridge.canEnterWitnessDeweyBridge === "function"
    ) {
      return NetCycleWitnessLedgerBridge.canEnterWitnessDeweyBridge(input);
    }

    return (
      input.status === ACCEPTED_WITNESS_BRIDGE_STATUS &&
      input.witness_bridged === true &&
      input.witness_preserved === true &&
      input.authority_allowed === false &&
      input.external_call_allowed === false &&
      input.executed === false &&
      input.witness_result &&
      input.witness_result.status === ACCEPTED_WITNESS_STATUS
    );
  }

  function readWitnessResult(input = {}) {
    if (!input || typeof input !== "object") {
      return null;
    }

    if (input.status === ACCEPTED_WITNESS_STATUS) {
      return input;
    }

    if (
      input.witness_result &&
      input.witness_result.status === ACCEPTED_WITNESS_STATUS
    ) {
      return input.witness_result;
    }

    if (
      NetCycleWitnessLedgerBridge &&
      typeof NetCycleWitnessLedgerBridge.readWitnessResult === "function"
    ) {
      return NetCycleWitnessLedgerBridge.readWitnessResult(input);
    }

    return null;
  }

  function deweyResultLooksReady(result = {}) {
    return Boolean(
      result &&
      typeof result === "object" &&
      (
        result.status === ACCEPTED_DEWEY_QUEUE_STATUS ||
        result.status === ACCEPTED_DEWEY_PROCESS_STATUS
      ) &&
      result.candidate_only === true &&
      result.final_classification === false &&
      result.authority_allowed === false &&
      result.external_call_allowed === false &&
      result.executed === false
    );
  }

  function returnToDewey(input = {}, options = {}) {
    configure(options.deps || {});

    const received = recordReceived(input);

    if (!input || typeof input !== "object") {
      return reject(
        {
          received,
          input
        },
        "INVALID_CYCLE_WITNESS_DEWEY_RETURN_INPUT"
      );
    }

    if (containsBlockedMaterial(input)) {
      return hold(
        {
          received,
          input
        },
        "CYCLE_WITNESS_DEWEY_RETURN_BLOCKED_SENSITIVE_OR_000_MATERIAL"
      );
    }

    if (!isWitnessBridgeRecord(input)) {
      return hold(
        {
          received,
          input
        },
        "CYCLE_WITNESS_DEWEY_RETURN_REQUIRES_WITNESS_BRIDGE_RECORD"
      );
    }

    const witnessResult = readWitnessResult(input);

    if (!witnessResult) {
      return hold(
        {
          received,
          input
        },
        "CYCLE_WITNESS_DEWEY_RETURN_MISSING_WITNESS_RESULT"
      );
    }

    if (!WitnessDeweyBridge) {
      return hold(
        {
          received,
          input,
          witnessResult
        },
        "WITNESS_DEWEY_BRIDGE_NOT_AVAILABLE"
      );
    }

    const mode = options.mode === "process" ? "process" : "queue";

    const deweyResult = mode === "process"
      ? WitnessDeweyBridge.processForDewey(
          witnessResult,
          options.reason || "CLOSED_CYCLE_WITNESS_PROCESSED_FOR_DEWEY"
        )
      : WitnessDeweyBridge.queueForDewey(
          witnessResult,
          options.reason || "CLOSED_CYCLE_WITNESS_QUEUED_FOR_DEWEY"
        );

    if (!deweyResultLooksReady(deweyResult)) {
      return hold(
        {
          received,
          input,
          witnessResult,
          deweyResult
        },
        "WITNESS_DEWEY_BRIDGE_DID_NOT_CREATE_CANDIDATE_RETURN"
      );
    }

    const returned = {
      id: makeId("cycleWitnessDeweyReturn"),
      returned_at: now(),
      received_id: received.id,
      witness_bridge_id: input.id || null,
      witness_result_id: witnessResult.id || null,
      mode,
      witness_result: clone(witnessResult),
      dewey_result: clone(deweyResult),
      dewey_return_ready: true,
      candidate_only: true,
      final_classification: false,
      authority_allowed: false,
      external_call_allowed: false,
      executed: false,
      status: "net_cycle_witness_returned_to_dewey_candidate_only"
    };

    state.returned.push(returned);
    return returned;
  }

  function receiveFromWitnessLedgerBridge(input = {}, options = {}) {
    configure(options.deps || {});

    if (isWitnessBridgeRecord(input)) {
      return returnToDewey(input, options);
    }

    if (
      !NetCycleWitnessLedgerBridge ||
      typeof NetCycleWitnessLedgerBridge.receiveFromDispatcher !== "function"
    ) {
      return hold(input, "NET_CYCLE_WITNESS_LEDGER_BRIDGE_NOT_AVAILABLE");
    }

    const bridged = NetCycleWitnessLedgerBridge.receiveFromDispatcher(input, options);

    if (!isWitnessBridgeRecord(bridged)) {
      return hold(
        {
          input,
          bridged
        },
        "WITNESS_LEDGER_BRIDGE_DID_NOT_CREATE_DEWEY_READY_RECORD"
      );
    }

    return returnToDewey(bridged, options);
  }

  function canReturnToCoreLater(result = {}) {
    return Boolean(
      result &&
      typeof result === "object" &&
      result.status === "net_cycle_witness_returned_to_dewey_candidate_only" &&
      result.dewey_return_ready === true &&
      result.candidate_only === true &&
      result.final_classification === false &&
      result.authority_allowed === false &&
      result.external_call_allowed === false &&
      result.executed === false
    );
  }

  function readDeweyResult(result = {}) {
    if (!canReturnToCoreLater(result)) {
      return null;
    }

    return clone(result.dewey_result);
  }

  function peekReturned() {
    return clone(state.returned);
  }

  function pullNextReturned() {
    const next = state.returned.shift();

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
    returnToDewey,
    receiveFromWitnessLedgerBridge,
    isWitnessBridgeRecord,
    readWitnessResult,
    deweyResultLooksReady,
    containsBlockedMaterial,
    canReturnToCoreLater,
    readDeweyResult,
    peekReturned,
    pullNextReturned,
    canExecuteAuthority,
    canCallExternal,
    hold,
    reject,
    getState
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = CyberCrowdNetCycleWitnessDeweyReturn;
}
