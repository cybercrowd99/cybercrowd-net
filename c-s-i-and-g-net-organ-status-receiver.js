// c-s-i-and-g-net-organ-status-receiver.js
// CyberCrowd — CSI&G NET Organ Status Receiver
//
// Owns:
// - receiving sanitized CSI&G Core organ status summaries
// - preserving organ status for NET-side visibility
// - keeping Core organ details readable without granting NET authority
// - preparing pass / pending / held / rejected status packets for downstream NET consumers
//
// Does NOT own:
// - authority execution
// - identity creation
// - movement approval
// - final Dewey classification
// - provider execution
// - OAuth
// - credential storage
// - token storage
// - scraping
// - webhook delivery
// - payment
// - sessions
// - cookies
// - KV storage
// - UI
// - real-world execution

const CyberCrowdNetOrganStatusReceiver = (() => {
  const RECEIVER_NAME = "csi_and_g_net_organ_status_receiver";

  const ACCEPTED_CORE_STATUS = "csi_and_g_core_organ_status_snapshot_recorded_no_authority";
  const ACCEPTED_PAPER_STATUS = "csi_and_g_core_organ_paper_ladder_page_ready_no_authority";
  const NET_RECEIVED_STATUS = "csi_and_g_net_organ_status_received_no_authority";

  const BLOCKED_MARKERS = [
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
    "client_secret",
    "client secret",
    "api_key",
    "api key",
    "oauth",
    "scrape",
    "scraping",
    "health",
    "medical",
    "biometric",
    "gps",
    "precise location",
    "latitude",
    "longitude",
    "raw_camera",
    "raw camera",
    "raw_microphone",
    "raw microphone"
  ];

  const state = {
    configured: false,
    received: [],
    summaries: [],
    pass: [],
    pending: [],
    held: [],
    rejected: []
  };

  let CoreOrganStatusLedger = null;

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
    CoreOrganStatusLedger =
      deps.CoreOrganStatusLedger ||
      deps.coreOrganStatusLedger ||
      deps.organStatusLedger ||
      CoreOrganStatusLedger ||
      safeRequire("./c-s-i-and-g-core-organ-status-ledger.js") ||
      safeRequire("../core/c-s-i-and-g-core-organ-status-ledger.js") ||
      null;

    state.configured = Boolean(CoreOrganStatusLedger);

    return {
      configured: state.configured,
      has_core_organ_status_ledger: Boolean(CoreOrganStatusLedger)
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

  function containsBlockedMaterial(input) {
    const text = toText(input);

    return BLOCKED_MARKERS.some((marker) => {
      return text.includes(marker);
    });
  }

  function hold(target, reason) {
    const record = {
      id: makeId("netOrganStatusHold"),
      held_at: now(),
      receiver: RECEIVER_NAME,
      reason,
      target: clone(target),
      net_visible: false,
      authority_allowed: false,
      external_call_allowed: false,
      executed: false,
      status: "held_by_csi_and_g_net_organ_status_receiver"
    };

    state.held.push(record);
    return record;
  }

  function reject(target, reason) {
    const record = {
      id: makeId("netOrganStatusReject"),
      rejected_at: now(),
      receiver: RECEIVER_NAME,
      reason,
      target: clone(target),
      net_visible: false,
      authority_allowed: false,
      external_call_allowed: false,
      executed: false,
      status: "rejected_by_csi_and_g_net_organ_status_receiver"
    };

    state.rejected.push(record);
    return record;
  }

  function recordReceived(input = {}) {
    const record = {
      id: makeId("netOrganStatusReceive"),
      received_at: now(),
      receiver: RECEIVER_NAME,
      input: clone(input),
      authority_allowed: false,
      external_call_allowed: false,
      executed: false,
      status: "received_by_csi_and_g_net_organ_status_receiver"
    };

    state.received.push(record);
    return record;
  }

  function isAcceptedCoreStatus(input = {}) {
    return Boolean(
      input &&
      typeof input === "object" &&
      (
        input.status === ACCEPTED_CORE_STATUS ||
        input.status === ACCEPTED_PAPER_STATUS
      ) &&
      input.authority_allowed === false &&
      input.external_call_allowed === false &&
      input.executed === false
    );
  }

  function pullLatestCoreSnapshot() {
    configure();

    if (
      CoreOrganStatusLedger &&
      typeof CoreOrganStatusLedger.latestSnapshot === "function"
    ) {
      return CoreOrganStatusLedger.latestSnapshot();
    }

    return null;
  }

  function readPassFail(input = {}) {
    if (input.pass_fail) {
      return String(input.pass_fail).toUpperCase();
    }

    if (input.organ_run && input.organ_run.organ_ready === true) {
      return "PASS";
    }

    if (String(input.status || "").includes("held")) {
      return "HELD";
    }

    if (String(input.status || "").includes("rejected")) {
      return "REJECTED";
    }

    return "PENDING";
  }

  function sanitizeRows(rows = []) {
    if (!Array.isArray(rows)) {
      return [];
    }

    return rows.map((row) => {
      return {
        commit: row.commit || "",
        core_net: row.core_net || row.lane || "",
        file: row.file || row.step || "",
        pass_fail: row.pass_fail || "",
        parent: row.parent || "",
        note: row.note || ""
      };
    });
  }

  function buildNetSummary(input = {}, reason = "CORE_ORGAN_STATUS_TO_NET_VISIBILITY") {
    const passFail = readPassFail(input);

    return {
      id: makeId("netOrganStatusSummary"),
      receiver: RECEIVER_NAME,
      received_at: now(),
      reason,
      source_status_id: input.id || null,
      organ: input.organ || "csi_and_g_core_organ",
      pass_fail: passFail,
      label: input.label || "CSI&G Core Organ Status",
      page_title: input.page_title || input.title || "CYBERCROWD BUILD LADDER — CSI&G CORE ORGAN",
      page_note: input.page_note || input.note || "Do not cram. Continue on new page when needed.",
      organ_status: clone(input.organ_status || null),
      printable_rows: sanitizeRows(input.printable_rows || input.rows || []),
      net_visible: true,
      paper_ladder_ready: Boolean(input.paper_ladder_ready || input.printable),
      printable: Boolean(input.printable || input.paper_ladder_ready),
      authority_allowed: false,
      external_call_allowed: false,
      executed: false,
      status: NET_RECEIVED_STATUS
    };
  }

  function receive(input = {}, options = {}) {
    configure(options.deps || {});

    const received = recordReceived(input);

    if (!input || typeof input !== "object") {
      return reject(
        {
          received,
          input
        },
        "INVALID_NET_ORGAN_STATUS_INPUT"
      );
    }

    if (containsBlockedMaterial(input)) {
      return hold(
        {
          received,
          input
        },
        "NET_ORGAN_STATUS_BLOCKED_SENSITIVE_MATERIAL"
      );
    }

    if (!isAcceptedCoreStatus(input)) {
      return hold(
        {
          received,
          input
        },
        "NET_ORGAN_STATUS_REQUIRES_SANITIZED_CORE_STATUS"
      );
    }

    const summary = buildNetSummary(
      input,
      options.reason || "CORE_ORGAN_STATUS_TO_NET_VISIBILITY"
    );

    if (containsBlockedMaterial(summary)) {
      return hold(
        {
          received,
          input,
          summary
        },
        "NET_ORGAN_STATUS_SUMMARY_BLOCKED_SENSITIVE_MATERIAL"
      );
    }

    state.summaries.push(summary);

    if (summary.pass_fail === "PASS") {
      state.pass.push(summary);
    } else if (summary.pass_fail === "HELD") {
      state.held.push(summary);
    } else if (summary.pass_fail === "REJECTED") {
      state.rejected.push(summary);
    } else {
      state.pending.push(summary);
    }

    return summary;
  }

  function receiveLatestFromCore(options = {}) {
    configure(options.deps || {});

    const latest = pullLatestCoreSnapshot();

    if (!latest) {
      return hold(
        {},
        "NET_ORGAN_STATUS_NO_CORE_SNAPSHOT_AVAILABLE"
      );
    }

    return receive(latest, options);
  }

  function latestSummary() {
    if (!state.summaries.length) {
      return null;
    }

    return clone(state.summaries[state.summaries.length - 1]);
  }

  function peekSummaries() {
    return clone(state.summaries);
  }

  function peekPass() {
    return clone(state.pass);
  }

  function peekPending() {
    return clone(state.pending);
  }

  function pullNextSummary() {
    const next = state.summaries.shift();

    if (!next) {
      return null;
    }

    return clone(next);
  }

  function receiverStatus() {
    return {
      receiver: RECEIVER_NAME,
      configured: state.configured,
      received_count: state.received.length,
      summary_count: state.summaries.length,
      pass_count: state.pass.length,
      pending_count: state.pending.length,
      held_count: state.held.length,
      rejected_count: state.rejected.length,
      net_visible: true,
      authority_allowed: false,
      external_call_allowed: false,
      executed: false,
      status: "csi_and_g_net_organ_status_receiver_ready_no_authority"
    };
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
    RECEIVER_NAME,
    NET_RECEIVED_STATUS,
    configure,
    receive,
    receiveLatestFromCore,
    pullLatestCoreSnapshot,
    isAcceptedCoreStatus,
    buildNetSummary,
    latestSummary,
    peekSummaries,
    peekPass,
    peekPending,
    pullNextSummary,
    receiverStatus,
    containsBlockedMaterial,
    canExecuteAuthority,
    canCallExternal,
    hold,
    reject,
    getState
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = CyberCrowdNetOrganStatusReceiver;
}
