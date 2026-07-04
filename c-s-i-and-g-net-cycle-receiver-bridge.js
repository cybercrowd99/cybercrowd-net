// c-s-i-and-g-net-cycle-receiver-bridge.js
// CyberCrowd — NET Cycle Receiver Bridge
//
// Owns:
// - receiving Core NET Cycle handoff records
// - extracting approved Core-to-NET handoff envelopes
// - sending verified cycle handoffs into the NET Receiver
// - preserving the Core → NET cycle receive trail
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

const CyberCrowdNetCycleReceiverBridge = (() => {
  const ACCEPTED_CYCLE_STATUS = "core_net_cycle_handoff_ready_no_external_call";
  const ACCEPTED_HANDOFF_STATUS = "core_ready_for_net_no_external_call";
  const ACCEPTED_RECEIVER_STATUS = "net_receiver_accepted_no_external_call";

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
    accepted: [],
    held: [],
    rejected: []
  };

  let NetReceiver = null;

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
    NetReceiver =
      deps.NetReceiver ||
      deps.netReceiver ||
      deps.receiver ||
      NetReceiver ||
      safeRequire("./c-s-i-and-g-net-receiver.js") ||
      null;

    state.configured = Boolean(NetReceiver);

    return {
      configured: state.configured,
      has_net_receiver: Boolean(NetReceiver)
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
      id: makeId("netCycleReceiverHold"),
      held_at: now(),
      reason,
      target: clone(target),
      net_received: false,
      net_ready: false,
      authority_allowed: false,
      release_allowed: false,
      certificate_valid: false,
      external_call_allowed: false,
      executed: false,
      status: "held_by_net_cycle_receiver_bridge"
    };

    state.held.push(record);
    return record;
  }

  function reject(target, reason) {
    const record = {
      id: makeId("netCycleReceiverReject"),
      rejected_at: now(),
      reason,
      target: clone(target),
      net_received: false,
      net_ready: false,
      authority_allowed: false,
      release_allowed: false,
      certificate_valid: false,
      external_call_allowed: false,
      executed: false,
      status: "rejected_by_net_cycle_receiver_bridge"
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
      id: makeId("netCycleReceiverReceive"),
      received_at: now(),
      input: clone(input),
      net_received: false,
      net_ready: false,
      authority_allowed: false,
      release_allowed: false,
      certificate_valid: false,
      external_call_allowed: false,
      executed: false,
      status: "received_by_net_cycle_receiver_bridge"
    };

    state.received.push(record);
    return record;
  }

  function isCycleRecord(input = {}) {
    return Boolean(
      input &&
      typeof input === "object" &&
      input.status === ACCEPTED_CYCLE_STATUS &&
      input.cycle_ready === true &&
      input.net_ready === true &&
      input.authority_allowed === true &&
      input.release_allowed === true &&
      input.certificate_valid === true &&
      input.external_call_allowed === false &&
      input.executed === false &&
      input.handoff &&
      input.handoff.status === ACCEPTED_HANDOFF_STATUS
    );
  }

  function readHandoff(input = {}) {
    if (!input || typeof input !== "object") {
      return null;
    }

    if (input.status === ACCEPTED_HANDOFF_STATUS) {
      return input;
    }

    if (
      input.handoff &&
      typeof input.handoff === "object" &&
      input.handoff.status === ACCEPTED_HANDOFF_STATUS
    ) {
      return input.handoff;
    }

    if (
      input.result &&
      input.result.handoff &&
      input.result.handoff.status === ACCEPTED_HANDOFF_STATUS
    ) {
      return input.result.handoff;
    }

    return null;
  }

  function receiverAccepted(result = {}) {
    return Boolean(
      result &&
      typeof result === "object" &&
      result.status === ACCEPTED_RECEIVER_STATUS &&
      result.net_accepted === true &&
      result.net_ready === true &&
      result.authority_allowed === true &&
      result.release_allowed === true &&
      result.certificate_valid === true &&
      result.external_call_allowed === false &&
      result.executed === false
    );
  }

  function sendToReceiver(input = {}, reason = "NET_CYCLE_HANDOFF_TO_RECEIVER") {
    configure();

    const received = recordReceived(input);

    if (!input || typeof input !== "object") {
      return reject(
        {
          received,
          input
        },
        "INVALID_NET_CYCLE_RECEIVER_INPUT"
      );
    }

    if (containsBlockedMaterial(input)) {
      return hold(
        {
          received,
          input
        },
        "NET_CYCLE_RECEIVER_BLOCKED_SENSITIVE_OR_000_MATERIAL"
      );
    }

    if (!isCycleRecord(input)) {
      return hold(
        {
          received,
          input
        },
        "NET_CYCLE_RECEIVER_REQUIRES_CORE_NET_CYCLE_RECORD"
      );
    }

    const handoff = readHandoff(input);

    if (!handoff) {
      return hold(
        {
          received,
          input
        },
        "NET_CYCLE_RECEIVER_MISSING_HANDOFF"
      );
    }

    if (!NetReceiver || typeof NetReceiver.receive !== "function") {
      return hold(
        {
          received,
          input,
          handoff
        },
        "NET_RECEIVER_NOT_AVAILABLE"
      );
    }

    const receiverResult = NetReceiver.receive({
      ...clone(handoff),
      source: "net_cycle_receiver_bridge",
      reason,
      cycle_record_id: input.id || null
    });

    if (!receiverAccepted(receiverResult)) {
      return hold(
        {
          received,
          input,
          handoff,
          receiverResult
        },
        "NET_RECEIVER_DID_NOT_ACCEPT_CYCLE_HANDOFF"
      );
    }

    const accepted = {
      id: makeId("netCycleReceiverAccepted"),
      accepted_at: now(),
      received_id: received.id,
      cycle_record_id: input.id || null,
      handoff_id: handoff.id || null,
      handoff: clone(handoff),
      receiver_result: clone(receiverResult),
      net_received: true,
      net_ready: true,
      authority_allowed: true,
      release_allowed: true,
      certificate_valid: true,
      external_call_allowed: false,
      executed: false,
      status: "net_cycle_received_by_receiver_no_external_call"
    };

    state.accepted.push(accepted);
    return accepted;
  }

  function receive(input = {}, options = {}) {
    configure(options.deps || {});

    return sendToReceiver(
      input,
      options.reason || "CORE_NET_CYCLE_RECEIVED_BY_NET"
    );
  }

  function canEnterAdapterShelf(result = {}) {
    return Boolean(
      result &&
      typeof result === "object" &&
      result.status === "net_cycle_received_by_receiver_no_external_call" &&
      result.net_received === true &&
      result.net_ready === true &&
      result.authority_allowed === true &&
      result.release_allowed === true &&
      result.certificate_valid === true &&
      result.external_call_allowed === false &&
      result.executed === false &&
      result.receiver_result &&
      result.receiver_result.status === ACCEPTED_RECEIVER_STATUS
    );
  }

  function readReceiverResult(result = {}) {
    if (!canEnterAdapterShelf(result)) {
      return null;
    }

    return clone(result.receiver_result);
  }

  function peekAccepted() {
    return clone(state.accepted);
  }

  function pullNextAccepted() {
    const next = state.accepted.shift();

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
    receive,
    sendToReceiver,
    isCycleRecord,
    readHandoff,
    receiverAccepted,
    containsBlockedMaterial,
    canEnterAdapterShelf,
    readReceiverResult,
    peekAccepted,
    pullNextAccepted,
    canExecuteAuthority,
    canCallExternal,
    hold,
    reject,
    getState
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = CyberCrowdNetCycleReceiverBridge;
}
