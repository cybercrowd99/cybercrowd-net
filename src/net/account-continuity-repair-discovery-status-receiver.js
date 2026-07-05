// src/net/account-continuity-repair-discovery-status-receiver.js
// CyberCrowd NET — Account Continuity Repair Discovery Status Receiver
// Owns: receiving safe Core repair-discovery summaries for NET/display/email transport.
// Rule: Core records repair discovery. NET shows safe status.
// Ask once with respect. No pressure. No punishment. No identity exposure.
// Does not: send email, reopen accounts, give free service automatically,
// force return, punish leaving, expose identity evidence, include private proof,
// include address/phone/first name/raw uIDL, run payments, or deal directly with customer.

const AccountContinuityRepairDiscoveryStatusReceiver = (() => {
  const receivedStatuses = [];

  function now() {
    return new Date().toISOString();
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function makeId(prefix) {
    return `${prefix}.${Date.now()}.${Math.random().toString(36).slice(2, 10)}`;
  }

  function requireObject(value, errorCode) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error(errorCode);
    }

    return value;
  }

  function requireText(value, errorCode) {
    if (!value || typeof value !== "string" || !value.trim()) {
      throw new Error(errorCode);
    }

    return value.trim();
  }

  function normalizeText(value) {
    if (!value || typeof value !== "string") {
      return "";
    }

    return value.trim();
  }

  function normalizeBoolean(value) {
    return value === true;
  }

  function normalizeNumber(value, fallback = 0) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return fallback;
    }

    return number;
  }

  function normalizeList(value) {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .filter((item) => item !== null && item !== undefined)
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  function normalizeSafeReferences(references) {
    if (!Array.isArray(references)) {
      return [];
    }

    return references.map((reference) => {
      const cleanReference =
        reference && typeof reference === "object" && !Array.isArray(reference)
          ? reference
          : {};

      return {
        type: normalizeText(cleanReference.type),
        value: normalizeText(cleanReference.value),
      };
    }).filter((reference) => reference.type && reference.value);
  }

  function normalizeDisplaySummary(summary = {}) {
    if (!summary || typeof summary !== "object" || Array.isArray(summary)) {
      return {
        headline: "",
        body: "",
        safe_tags: [],
        failure_codes: [],
      };
    }

    return {
      headline: normalizeText(summary.headline),
      body: normalizeText(summary.body),
      safe_tags: normalizeList(summary.safe_tags),
      failure_codes: normalizeList(summary.failure_codes),
    };
  }

  function normalizeDiscoverySummary(summary = {}) {
    if (!summary || typeof summary !== "object" || Array.isArray(summary)) {
      return {
        discovery_source: "",
        offer_type: "",
        repair_found: false,
        signal_needed_repair: false,
        feedback_has_value: false,
        ask_once: true,
        no_pressure: true,
        no_punishment: true,
        no_silent_reopen: true,
        biff_passed: false,
        failure_count: 0,
        safe_reference_count: 0,
        outreach_packet_present: false,
        response_present: false,
      };
    }

    return {
      discovery_source: normalizeText(summary.discovery_source),
      offer_type: normalizeText(summary.offer_type),
      repair_found: normalizeBoolean(summary.repair_found),
      signal_needed_repair: normalizeBoolean(summary.signal_needed_repair),
      feedback_has_value: normalizeBoolean(summary.feedback_has_value),
      ask_once: summary.ask_once !== false,
      no_pressure: summary.no_pressure !== false,
      no_punishment: summary.no_punishment !== false,
      no_silent_reopen: summary.no_silent_reopen !== false,
      biff_passed: normalizeBoolean(summary.biff_passed),
      failure_count: normalizeNumber(summary.failure_count, 0),
      safe_reference_count: normalizeNumber(summary.safe_reference_count, 0),
      outreach_packet_present: normalizeBoolean(summary.outreach_packet_present),
      response_present: normalizeBoolean(summary.response_present),
    };
  }

  function normalizeOutreachPacketSummary(summary = {}) {
    if (!summary || typeof summary !== "object" || Array.isArray(summary)) {
      return {
        packet_present: false,
        provider_ready: false,
        optional: true,
        pressure_allowed: false,
        punishment_allowed: false,
        silent_reopen_allowed: false,
      };
    }

    return {
      packet_present: normalizeBoolean(summary.packet_present),
      packet_id: normalizeText(summary.packet_id),
      packet_type: normalizeText(summary.packet_type),
      offer_type: normalizeText(summary.offer_type),
      offer_label: normalizeText(summary.offer_label),
      offer_url_present: normalizeBoolean(summary.offer_url_present),
      subject: normalizeText(summary.subject),
      body_present: normalizeBoolean(summary.body_present),
      identity_boundary: normalizeText(summary.identity_boundary),
      provider_ready: normalizeBoolean(summary.provider_ready),
      optional: summary.optional !== false,
      pressure_allowed: normalizeBoolean(summary.pressure_allowed),
      punishment_allowed: normalizeBoolean(summary.punishment_allowed),
      silent_reopen_allowed: normalizeBoolean(summary.silent_reopen_allowed),
      safe_reference_count: normalizeNumber(summary.safe_reference_count, 0),
    };
  }

  function normalizeResponseSummary(summary = {}) {
    if (!summary || typeof summary !== "object" || Array.isArray(summary)) {
      return {
        response_present: false,
        response_state: "",
        accepted_offer: false,
        declined_offer: false,
        requested_no_contact: false,
      };
    }

    return {
      response_present: normalizeBoolean(summary.response_present),
      recorded_at: normalizeText(summary.recorded_at),
      response_state: normalizeText(summary.response_state),
      accepted_offer: normalizeBoolean(summary.accepted_offer),
      declined_offer: normalizeBoolean(summary.declined_offer),
      requested_no_contact: normalizeBoolean(summary.requested_no_contact),
      safe_note_present: normalizeBoolean(summary.safe_note_present),
    };
  }

  function normalizeBiffCheck(check = {}) {
    if (!check || typeof check !== "object" || Array.isArray(check)) {
      return {
        passed: false,
        point: "",
        flags: [],
      };
    }

    return {
      passed: normalizeBoolean(check.passed),
      point: normalizeText(check.point),
      flags: normalizeList(check.flags),
    };
  }

  function normalizeStatus(status = {}) {
    const cleanStatus = requireObject(status, "STATUS_REQUIRED");

    return {
      received_id: makeId("accountContinuityRepairDiscoveryNetStatus"),
      received_at: now(),
      source: "core.account-continuity-repair-discovery-status-ledger",
      discovery_id: requireText(cleanStatus.discovery_id, "DISCOVERY_ID_REQUIRED"),
      discovery_source: normalizeText(cleanStatus.discovery_source),
      uidl_hint: normalizeText(cleanStatus.uidl_hint),
      account_number: normalizeText(cleanStatus.account_number),
      account_tag: normalizeText(cleanStatus.account_tag),
      report_id: normalizeText(cleanStatus.report_id),
      exit_signal_id: normalizeText(cleanStatus.exit_signal_id),
      status: requireText(cleanStatus.status, "STATUS_REQUIRED"),
      ledger_state: normalizeText(cleanStatus.ledger_state),
      offer_type: normalizeText(cleanStatus.offer_type),
      safe_references: normalizeSafeReferences(cleanStatus.safe_references),
      display_summary: normalizeDisplaySummary(cleanStatus.display_summary),
      discovery_summary: normalizeDiscoverySummary(cleanStatus.discovery_summary),
      outreach_packet_summary: normalizeOutreachPacketSummary(cleanStatus.outreach_packet_summary),
      response_summary: normalizeResponseSummary(cleanStatus.response_summary),
      biff_check: normalizeBiffCheck(cleanStatus.biff_check),
      failures: normalizeList(cleanStatus.failures),
      identity_boundary: normalizeText(cleanStatus.identity_boundary),
      service_boundary: normalizeText(cleanStatus.service_boundary),
    };
  }

  function receiveStatus(status = {}) {
    const normalized = normalizeStatus(status);

    normalized.net_state = deriveNetState(normalized);
    normalized.display_cards = buildDisplayCards(normalized);
    normalized.paper_ladder_row = buildPaperLadderRow(normalized);

    receivedStatuses.push(clone(normalized));

    return clone(normalized);
  }

  function deriveNetState(status) {
    if (status.ledger_state === "offer_ready") {
      return "offer_ready";
    }

    if (status.ledger_state === "blocked") {
      return "blocked";
    }

    if (status.ledger_state === "offer_accepted") {
      return "offer_accepted";
    }

    if (status.ledger_state === "offer_declined") {
      return "offer_declined";
    }

    if (status.ledger_state === "do_not_contact_recorded") {
      return "do_not_contact_recorded";
    }

    return "unknown";
  }

  function buildDisplayCards(status) {
    if (status.net_state === "blocked") {
      return buildBlockedCards(status);
    }

    if (status.net_state === "offer_ready") {
      return buildOfferReadyCards(status);
    }

    if (status.net_state === "offer_accepted") {
      return buildOfferAcceptedCards(status);
    }

    if (status.net_state === "offer_declined") {
      return buildOfferDeclinedCards(status);
    }

    if (status.net_state === "do_not_contact_recorded") {
      return buildDoNotContactCards(status);
    }

    return buildUnknownCards(status);
  }

  function buildBlockedCards(status) {
    return [
      {
        card_type: "REPAIR_DISCOVERY_BLOCKED",
        headline: status.display_summary.headline || "Repair discovery outreach blocked",
        body: status.display_summary.body || "Repair discovery signal exists, but outreach is not allowed.",
        safe_status: "blocked",
        offer_type: status.offer_type,
        failure_count: status.failures.length,
      },
      {
        card_type: "SERVICE_BOUNDARY",
        headline: "Respect boundary",
        body: "No pressure, no punishment, no repeat outreach, and no identity exposure.",
        safe_status: "respect_boundary",
      },
    ];
  }

  function buildOfferReadyCards(status) {
    const cards = [
      {
        card_type: "REPAIR_DISCOVERY_OFFER_READY",
        headline: status.display_summary.headline || "Repair discovery outreach ready",
        body: status.display_summary.body || "A respectful optional opening is ready because the exit signal revealed repair value.",
        safe_status: "offer_ready",
        offer_type: status.offer_type,
      },
      {
        card_type: "REPAIR_VALUE",
        headline: "Repair value found",
        body: buildRepairValueBody(status),
        safe_status: "repair_value",
      },
    ];

    const referenceCard = buildSafeReferenceCard(status);

    if (referenceCard) {
      cards.push(referenceCard);
    }

    if (status.outreach_packet_summary.packet_present) {
      cards.push({
        card_type: "OUTREACH_PACKET",
        headline: "Optional outreach packet ready",
        body: buildOutreachPacketBody(status),
        safe_status: status.outreach_packet_summary.provider_ready
          ? "provider_ready"
          : "provider_not_ready",
        offer_label: status.outreach_packet_summary.offer_label,
      });
    }

    if (status.biff_check.passed) {
      cards.push({
        card_type: "BIFF_CHECK",
        headline: "Biff check passed",
        body: "The point was checked before outreach was prepared.",
        safe_status: "biff_passed",
      });
    }

    cards.push({
      card_type: "SERVICE_BOUNDARY",
      headline: "Ask once with respect",
      body: "The return is optional. No pressure. No punishment. No silent reopen.",
      safe_status: "ask_once_with_respect",
    });

    return cards;
  }

  function buildOfferAcceptedCards(status) {
    return [
      {
        card_type: "REPAIR_DISCOVERY_ACCEPTED",
        headline: "Repair discovery offer accepted",
        body: "The optional repair-discovery opening was accepted.",
        safe_status: "offer_accepted",
        offer_type: status.offer_type,
      },
      {
        card_type: "HUMAN_CHOSE_YES",
        headline: "Human chose yes",
        body: "The next lane may continue by normal approval and service rules.",
        safe_status: "human_chose_yes",
      },
    ];
  }

  function buildOfferDeclinedCards(status) {
    return [
      {
        card_type: "REPAIR_DISCOVERY_DECLINED",
        headline: "Repair discovery offer declined",
        body: "The optional repair-discovery opening was declined.",
        safe_status: "offer_declined",
        offer_type: status.offer_type,
      },
      {
        card_type: "HUMAN_CHOSE_NO",
        headline: "Human chose no",
        body: "No return is forced. The boundary remains respected.",
        safe_status: "human_chose_no",
      },
    ];
  }

  function buildDoNotContactCards(status) {
    return [
      {
        card_type: "DO_NOT_CONTACT_RECORDED",
        headline: "Do-not-contact recorded",
        body: "No further repair-discovery outreach should be sent for this lane.",
        safe_status: "do_not_contact_recorded",
      },
      {
        card_type: "RESPECT_BOUNDARY",
        headline: "Respect boundary",
        body: "The person requested no further outreach.",
        safe_status: "respect_boundary",
      },
    ];
  }

  function buildUnknownCards(status) {
    return [
      {
        card_type: "REPAIR_DISCOVERY_UNKNOWN",
        headline: "Repair discovery state unknown",
        body: "Repair discovery status exists but does not match a known NET state.",
        safe_status: "unknown",
        ledger_state: status.ledger_state,
      },
    ];
  }

  function buildRepairValueBody(status) {
    const pieces = [];

    if (status.discovery_summary.repair_found) {
      pieces.push("repair found");
    }

    if (status.discovery_summary.signal_needed_repair) {
      pieces.push("signal needed repair");
    }

    if (status.discovery_summary.feedback_has_value) {
      pieces.push("feedback has value");
    }

    if (!pieces.length) {
      pieces.push("repair value not confirmed");
    }

    return pieces.join(" · ");
  }

  function buildOutreachPacketBody(status) {
    const pieces = [];

    if (status.outreach_packet_summary.optional) {
      pieces.push("optional");
    }

    if (status.outreach_packet_summary.offer_label) {
      pieces.push(status.outreach_packet_summary.offer_label);
    }

    if (status.outreach_packet_summary.offer_url_present) {
      pieces.push("offer link present");
    }

    if (!status.outreach_packet_summary.pressure_allowed) {
      pieces.push("no pressure");
    }

    if (!status.outreach_packet_summary.punishment_allowed) {
      pieces.push("no punishment");
    }

    if (!status.outreach_packet_summary.silent_reopen_allowed) {
      pieces.push("no silent reopen");
    }

    return pieces.join(" · ");
  }

  function buildSafeReferenceCard(status) {
    const references = [];

    if (status.account_number) {
      references.push("account number");
    }

    if (status.account_tag) {
      references.push("account tag");
    }

    if (status.uidl_hint) {
      references.push("masked uIDL tag");
    }

    if (status.report_id) {
      references.push("report reference");
    }

    if (status.exit_signal_id) {
      references.push("exit signal reference");
    }

    if (!references.length) {
      return null;
    }

    return {
      card_type: "SAFE_REFERENCES",
      headline: "Safe references present",
      body: `NET may show: ${references.join(", ")}.`,
      safe_status: "safe_references_only",
      reference_count: references.length,
    };
  }

  function buildPaperLadderRow(status) {
    return {
      row_id: makeId("accountContinuityRepairDiscoveryNetPaperRow"),
      discovery_id: status.discovery_id,
      received_at: status.received_at,
      discovery_source: status.discovery_source,
      net_state: status.net_state,
      offer_type: status.offer_type,
      has_account_number: Boolean(status.account_number),
      has_account_tag: Boolean(status.account_tag),
      has_masked_uidl_hint: Boolean(status.uidl_hint),
      has_report_id: Boolean(status.report_id),
      has_exit_signal_id: Boolean(status.exit_signal_id),
      repair_found: status.discovery_summary.repair_found,
      signal_needed_repair: status.discovery_summary.signal_needed_repair,
      feedback_has_value: status.discovery_summary.feedback_has_value,
      biff_passed: status.biff_check.passed,
      outreach_packet_present: status.outreach_packet_summary.packet_present,
      provider_ready: status.outreach_packet_summary.provider_ready,
      response_present: status.response_summary.response_present,
      accepted_offer: status.response_summary.accepted_offer,
      declined_offer: status.response_summary.declined_offer,
      requested_no_contact: status.response_summary.requested_no_contact,
      failure_count: status.failures.length,
      boundary: "NET_RECEIVES_REPAIR_DISCOVERY_SAFE_STATUS_NO_PRESSURE_NO_PUNISHMENT_NO_IDENTITY_EXPOSURE",
    };
  }

  function listStatuses(filter = {}) {
    const cleanFilter = filter && typeof filter === "object" ? filter : {};
    const discoveryId = normalizeText(cleanFilter.discovery_id);
    const reportId = normalizeText(cleanFilter.report_id);
    const netState = normalizeText(cleanFilter.net_state);
    const status = normalizeText(cleanFilter.status);
    const offerType = normalizeText(cleanFilter.offer_type);

    return receivedStatuses
      .filter((item) => {
        if (discoveryId && item.discovery_id !== discoveryId) {
          return false;
        }

        if (reportId && item.report_id !== reportId) {
          return false;
        }

        if (netState && item.net_state !== netState) {
          return false;
        }

        if (status && item.status !== status) {
          return false;
        }

        if (offerType && item.offer_type !== offerType) {
          return false;
        }

        return true;
      })
      .map(clone);
  }

  function latestStatus() {
    if (!receivedStatuses.length) {
      return null;
    }

    return clone(receivedStatuses[receivedStatuses.length - 1]);
  }

  function listPaperLadderRows(filter = {}) {
    return listStatuses(filter).map((status) => clone(status.paper_ladder_row));
  }

  function clearStatuses() {
    receivedStatuses.length = 0;
    return true;
  }

  return {
    receiveStatus,
    listStatuses,
    latestStatus,
    listPaperLadderRows,
    clearStatuses,
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = AccountContinuityRepairDiscoveryStatusReceiver;
}
