// c-s-i-and-g-net-receiver.js
// CyberCrowd — NET Receiver
//
// Owns:
// - receiving sanitized Core-to-NET handoff envelopes
// - validating that the envelope came from the handoff contract
// - holding NET-ready material without making external calls
// - blocking 000 material from entering NET
// - blocking private/session/token material from NET intake
// - preserving the receiver trail for later NET adapters
//
// Does NOT own:
// - external API calls
// - OAuth
// - scraping
// - provider adapters
// - social adapters
// - webhook delivery
// - payment
// - sessions
// - cookies
// - KV storage
// - UI
// - real-world execution
// - authority execution

const CyberCrowdNetReceiver = (() => {
  const LANE_000 = "000_future_sci_fi_unclassified";

  const PRIVATE_MARKERS = [
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
    "session",
    "cookie",
    "kv"
  ];

  const ACCEPTED_ENVELOPE_STATUS = "net_handoff_envelope_ready";
  const ACCEPTED_HANDOFF_STATUS = "core_ready_for_net_no_external_call";

  const state = {
    configured: false,
    received: [],
    inbox: [],
    accepted: [],
    held: [],
    rejected: []
  };

  let NetHandoffContract = null;

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
    NetHandoffContract =
      deps.NetHandoffContract ||
      deps.netHandoffContract ||
      deps.handoffContract ||
      NetHandoffContract ||
      safeRequire("./c-s-i-and-g-net-handoff-contract.js") ||
      null;

    state.configured = Boolean(NetHandoffContract);

    return {
      configured: state.configured,
      has_net_handoff_contract: Boolean(NetHandoffContract)
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
      id: makeId("netReceiverHold"),
      held_at: now(),
      reason,
      target: clone(target),
      net_accepted: false,
      net_ready: false,
      authority_allowed: false,
      release_allowed: false,
      certificate_valid: false,
      external_call_allowed: false,
      executed: false,
      status: "held_by_net_receiver"
    };

    state.held.push(record);
    return record;
  }

  function reject(target, reason) {
    const record = {
      id: makeId("netReceiverReject"),
      rejected_at: now(),
      reason,
      target: clone(target),
      net_accepted: false,
      net_ready: false,
      authority_allowed: false,
      release_allowed: false,
      certificate_valid: false,
      external_call_allowed: false,
      executed: false,
      status: "rejected_by_net_receiver"
    };

    state.rejected.push(record);
    return record;
  }

  function recordReceived(input = {}) {
    const record = {
      id: makeId("netReceive"),
      received_at: now(),
      input: clone(input),
      net_accepted: false,
      net_ready: false,
      authority_allowed: false,
      release_allowed: false,
      certificate_valid: false,
      external_call_allowed: false,
      executed: false,
      status: "received_by_net_receiver"
    };

    state.received.push(record);
    return record;
  }

  function contains000(input) {
    const text = toText(input);

    return (
      text.includes(LANE_000) ||
      text.includes("null horizon") ||
      text.includes("preserved_in_000") ||
      text.includes("unclassified_signal_routed_to_000")
    );
  }

  function containsPrivateMaterial(input) {
    const text = toText(input);

    return PRIVATE_MARKERS.some((marker) => {
      return text.includes(marker);
    });
  }

  function readEnvelope(input = {}) {
    if (!input || typeof input !== "object") {
      return null;
    }

    if (input.status === ACCEPTED_ENVELOPE_STATUS) {
      return input;
    }

    if (
      input.envelope &&
      typeof input.envelope === "object" &&
      input.envelope.status === ACCEPTED_ENVELOPE_STATUS
    ) {
      return input.envelope;
    }

    if (
      input.result &&
      input.result.envelope &&
      typeof input.result.envelope === "object" &&
      input.result.envelope.status === ACCEPTED_ENVELOPE_STATUS
    ) {
      return input.result.envelope;
    }

    return null;
  }

  function isCoreHandoff(input = {}) {
    if (!input || typeof input !== "object") {
      return false;
    }

    return (
      input.status === ACCEPTED_HANDOFF_STATUS &&
      input.net_ready === true &&
      input.authority_allowed === true &&
      input.release_allowed === true &&
      input.certificate_valid === true &&
      input.executed === false &&
      input.external_call_allowed === false
    );
  }

  function isEnvelopeReady(envelope = {}) {
    if (!envelope || typeof envelope !== "object") {
      return false;
    }

    return (
      envelope.status === ACCEPTED_ENVELOPE_STATUS &&
      envelope.net_ready === true &&
      envelope.authority_allowed === true &&
      envelope.release_allowed === true &&
      envelope.certificate_valid === true &&
      envelope.executed === false &&
      envelope.external_call_allowed === false
    );
  }

  function handoffContractAllows(input = {}) {
    configure();

    if (
      NetHandoffContract &&
      typeof NetHandoffContract.canEnterNet === "function"
    ) {
      return NetHandoffContract.canEnterNet(input);
    }

    return isCoreHandoff(input);
  }

  function validate(input = {}) {
    const envelope = readEnvelope(input);

    if (!input || typeof input !== "object") {
      return {
        valid: false,
        reason: "INVALID_NET_RECEIVER_INPUT",
        envelope: null
      };
    }

    if (contains000(input)) {
      return {
        valid: false,
        reason: "000_CANNOT_ENTER_NET_RECEIVER",
        envelope
      };
    }

    if (containsPrivateMaterial(input)) {
      return {
        valid: false,
        reason: "PRIVATE_MATERIAL_BLOCKED_AT_NET_RECEIVER",
        envelope
      };
    }

    if (isCoreHandoff(input) && handoffContractAllows(input)) {
      return {
        valid: true,
        reason: "CORE_HANDOFF_ACCEPTED_BY_NET_RECEIVER",
        envelope
      };
    }

    if (envelope && isEnvelopeReady(envelope)) {
      return {
        valid: true,
        reason: "NET_HANDOFF_ENVELOPE_ACCEPTED",
        envelope
      };
    }

    return {
      valid: false,
      reason: "NET_RECEIVER_REQUIRES_CORE_HANDOFF_ENVELOPE",
      envelope
    };
  }

  function accept(input = {}, receivedRecord = null) {
    const envelope = readEnvelope(input);

    const accepted = {
      id: makeId("netAccepted"),
      accepted_at: now(),
      received_id: receivedRecord && receivedRecord.id || null,
      source: input.source || envelope && envelope.source || "core_to_net_handoff",
      target: input.target || envelope && envelope.target || "net_receiver_hold",
      envelope: clone(envelope || input.envelope || input),
      original: clone(input),
      net_accepted: true,
      net_ready: true,
      authority_allowed: true,
      release_allowed: true,
      certificate_valid: true,
      external_call_allowed: false,
      executed: false,
      status: "net_receiver_accepted_no_external_call"
    };

    state.accepted.push(accepted);
    state.inbox.push(accepted);

    return accepted;
  }

  function receive(input = {}, options = {}) {
    configure(options.deps || {});

    const receivedRecord = recordReceived(input);
    const validation = validate(input);

    if (!validation.valid) {
      return hold(
        {
          receivedRecord,
          validation,
          input
        },
        validation.reason
      );
    }

    return accept(input, receivedRecord);
  }

  function receiveFromHandoff(input = {}, options = {}) {
    configure(options.deps || {});

    if (
      isCoreHandoff(input) ||
      readEnvelope(input)
    ) {
      return receive(input, options);
    }

    if (
      !NetHandoffContract ||
      typeof NetHandoffContract.review !== "function"
    ) {
      return hold(input, "NET_HANDOFF_CONTRACT_NOT_AVAILABLE");
    }

    const handoff = NetHandoffContract.review(input, {
      ...options,
      source: options.source || "net_receiver_requested_handoff"
    });

    if (!handoffContractAllows(handoff)) {
      return hold(
        {
          input,
          handoff
        },
        "HANDOFF_CONTRACT_DID_NOT_APPROVE_NET_RECEIVER"
      );
    }

    return receive(handoff, options);
  }

  function peekInbox() {
    return clone(state.inbox);
  }

  function pullNext() {
    const next = state.inbox.shift();

    if (!next) {
      return null;
    }

    return clone(next);
  }

  function canCallExternalAdapter(result) {
    return Boolean(
      result &&
      typeof result === "object" &&
      result.status === "net_receiver_accepted_no_external_call" &&
      result.net_accepted === true &&
      result.net_ready === true &&
      result.authority_allowed === true &&
      result.release_allowed === true &&
      result.certificate_valid === true &&
      result.external_call_allowed === false &&
      result.executed === false
    );
  }

  function getState() {
    return clone(state);
  }

  return {
    LANE_000,
    configure,
    receive,
    receiveFromHandoff,
    validate,
    accept,
    readEnvelope,
    isCoreHandoff,
    isEnvelopeReady,
    contains000,
    containsPrivateMaterial,
    peekInbox,
    pullNext,
    canCallExternalAdapter,
    hold,
    reject,
    getState
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = CyberCrowdNetReceiver;
}
