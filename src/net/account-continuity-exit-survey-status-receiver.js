// src/net/account-continuity-exit-survey-status-receiver.js
// CyberCrowd NET — Account Continuity Exit Survey Status Receiver
// Owns: receiving safe Core exit survey summaries for NET/display/email transport.
// Rule: Core records survey truth. NET shows safe status.
// State the problem stays allowed. Please state your facts in your perspective.
// Thank you stays visible. No pressure. No punishment. No identity exposure.
// Does not: send email, stop termination, reopen accounts, force response,
// punish leaving, expose identity evidence, include private proof,
// include address/phone/first name/raw uIDL, run payments, or deal directly with customer.

const AccountContinuityExitSurveyStatusReceiver = (() => {
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

  function normalizeSurveySummary(summary = {}) {
    if (!summary || typeof summary !== "object" || Array.isArray(summary)) {
      return {
        survey_type: "",
        question_present: false,
        packet_present: false,
        provider_ready: false,
        optional: true,
        pressure_allowed: false,
        punishment_allowed: false,
        termination_stop_allowed: false,
        silent_reopen_allowed: false,
        thank_you_required: true,
        thank_you_present: false,
        safe_reference_count: 0,
        failure_count: 0,
        response_present: false,
        answered: false,
        skipped: false,
        declined: false,
        requested_no_contact: false,
        rant_allowed: true,
        rant_present: false,
        rant_value_level: "none",
      };
    }

    return {
      survey_type: normalizeText(summary.survey_type),
      question_present: normalizeBoolean(summary.question_present),
      packet_present: normalizeBoolean(summary.packet_present),
      provider_ready: normalizeBoolean(summary.provider_ready),
      optional: summary.optional !== false,
      pressure_allowed: normalizeBoolean(summary.pressure_allowed),
      punishment_allowed: normalizeBoolean(summary.punishment_allowed),
      termination_stop_allowed: normalizeBoolean(summary.termination_stop_allowed),
      silent_reopen_allowed: normalizeBoolean(summary.silent_reopen_allowed),
      thank_you_required: summary.thank_you_required !== false,
      thank_you_present: normalizeBoolean(summary.thank_you_present),
      safe_reference_count: normalizeNumber(summary.safe_reference_count, 0),
      failure_count: normalizeNumber(summary.failure_count, 0),
      response_present: normalizeBoolean(summary.response_present),
      answered: normalizeBoolean(summary.answered),
      skipped: normalizeBoolean(summary.skipped),
      declined: normalizeBoolean(summary.declined),
      requested_no_contact: normalizeBoolean(summary.requested_no_contact),
      rant_allowed: summary.rant_allowed !== false,
      rant_present: normalizeBoolean(summary.rant_present),
      rant_value_level: normalizeText(summary.rant_value_level) || "none",
    };
  }

  function normalizeSurveyPacketSummary(summary = {}) {
    if (!summary || typeof summary !== "object" || Array.isArray(summary)) {
      return {
        packet_present: false,
        provider_ready: false,
        optional: true,
        pressure_allowed: false,
        punishment_allowed: false,
        termination_stop_allowed: false,
        silent_reopen_allowed: false,
        thank_you_required: true,
      };
    }

    return {
      packet_present: normalizeBoolean(summary.packet_present),
      packet_id: normalizeText(summary.packet_id),
      packet_type: normalizeText(summary.packet_type),
      survey_type: normalizeText(summary.survey_type),
      subject: normalizeText(summary.subject),
      body_present: normalizeBoolean(summary.body_present),
      question: normalizeText(summary.question),
      feedback_url_present: normalizeBoolean(summary.feedback_url_present),
      offer_label: normalizeText(summary.offer_label),
      offer_url_present: normalizeBoolean(summary.offer_url_present),
      identity_boundary: normalizeText(summary.identity_boundary),
      provider_ready: normalizeBoolean(summary.provider_ready),
      optional: summary.optional !== false,
      pressure_allowed: normalizeBoolean(summary.pressure_allowed),
      punishment_allowed: normalizeBoolean(summary.punishment_allowed),
      termination_stop_allowed: normalizeBoolean(summary.termination_stop_allowed),
      silent_reopen_allowed: normalizeBoolean(summary.silent_reopen_allowed),
      thank_you_required: summary.thank_you_required !== false,
      safe_reference_count: normalizeNumber(summary.safe_reference_count, 0),
    };
  }

  function normalizeResponseSummary(summary = {}) {
    if (!summary || typeof summary !== "object" || Array.isArray(summary)) {
      return {
        response_present: false,
        response_state: "not_answered",
        answered: false,
        skipped: false,
        declined: false,
        requested_no_contact: false,
        safe_feedback_present: false,
      };
    }

    return {
      response_present: normalizeBoolean(summary.response_present),
      recorded_at: normalizeText(summary.recorded_at),
      response_state: normalizeText(summary.response_state) || "not_answered",
      answered: normalizeBoolean(summary.answered),
      skipped: normalizeBoolean(summary.skipped),
      declined: normalizeBoolean(summary.declined),
      requested_no_contact: normalizeBoolean(summary.requested_no_contact),
      safe_feedback_present: normalizeBoolean(summary.safe_feedback_present),
      safe_feedback_length: normalizeNumber(summary.safe_feedback_length, 0),
    };
  }

  function normalizeThankYouSummary(summary = {}) {
    if (!summary || typeof summary !== "object" || Array.isArray(summary)) {
      return {
        thank_you_required: true,
        thank_you_present: false,
        message: "",
      };
    }

    return {
      thank_you_required: summary.thank_you_required !== false,
      thank_you_present: normalizeBoolean(summary.thank_you_present),
      message: normalizeText(summary.message),
    };
  }

  function normalizeRantSummary(summary = {}) {
    if (!summary || typeof summary !== "object" || Array.isArray(summary)) {
      return {
        rant_allowed: true,
        rant_present: false,
        rant_value_level: "none",
        reason: "",
        doctrine: "STATE_THE_PROBLEM",
      };
    }

    return {
      rant_allowed: summary.rant_allowed !== false,
      rant_present: normalizeBoolean(summary.rant_present),
      rant_value_level: normalizeText(summary.rant_value_level) || "none",
      reason: normalizeText(summary.reason),
      doctrine: normalizeText(summary.doctrine) || "STATE_THE_PROBLEM",
    };
  }

  function normalizeStatus(status = {}) {
    const cleanStatus = requireObject(status, "STATUS_REQUIRED");

    return {
      received_id: makeId("accountContinuityExitSurveyNetStatus"),
      received_at: now(),
      source: "core.account-continuity-exit-survey-status-ledger",
      survey_id: requireText(cleanStatus.survey_id, "SURVEY_ID_REQUIRED"),
      survey_type: normalizeText(cleanStatus.survey_type) || "termination_exit",
      uidl_hint: normalizeText(cleanStatus.uidl_hint),
      account_number: normalizeText(cleanStatus.account_number),
      account_tag: normalizeText(cleanStatus.account_tag),
      report_id: normalizeText(cleanStatus.report_id),
      termination_reference_id: normalizeText(cleanStatus.termination_reference_id),
      archive_reference_id: normalizeText(cleanStatus.archive_reference_id),
      recovery_review_id: normalizeText(cleanStatus.recovery_review_id),
      status: requireText(cleanStatus.status, "STATUS_REQUIRED"),
      ledger_state: normalizeText(cleanStatus.ledger_state),
      safe_references: normalizeSafeReferences(cleanStatus.safe_references),
      question: normalizeText(cleanStatus.question),
      display_summary: normalizeDisplaySummary(cleanStatus.display_summary),
      survey_summary: normalizeSurveySummary(cleanStatus.survey_summary),
      survey_packet_summary: normalizeSurveyPacketSummary(cleanStatus.survey_packet_summary),
      response_summary: normalizeResponseSummary(cleanStatus.response_summary),
      thank_you_summary: normalizeThankYouSummary(cleanStatus.thank_you_summary),
      rant_summary: normalizeRantSummary(cleanStatus.rant_summary),
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
    if (status.ledger_state === "survey_ready") {
      return "survey_ready";
    }

    if (status.ledger_state === "blocked") {
      return "blocked";
    }

    if (status.ledger_state === "survey_answered") {
      return "survey_answered";
    }

    if (status.ledger_state === "survey_skipped") {
      return "survey_skipped";
    }

    if (status.ledger_state === "survey_declined") {
      return "survey_declined";
    }

    if (status.ledger_state === "survey_response_recorded") {
      return "survey_response_recorded";
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

    if (status.net_state === "survey_ready") {
      return buildSurveyReadyCards(status);
    }

    if (status.net_state === "survey_answered") {
      return buildSurveyAnsweredCards(status);
    }

    if (status.net_state === "survey_skipped") {
      return buildSurveySkippedCards(status);
    }

    if (status.net_state === "survey_declined") {
      return buildSurveyDeclinedCards(status);
    }

    if (status.net_state === "survey_response_recorded") {
      return buildSurveyResponseRecordedCards(status);
    }

    if (status.net_state === "do_not_contact_recorded") {
      return buildDoNotContactCards(status);
    }

    return buildUnknownCards(status);
  }

  function buildBlockedCards(status) {
    return [
      {
        card_type: "EXIT_SURVEY_BLOCKED",
        headline: status.display_summary.headline || "Exit survey blocked",
        body: status.display_summary.body || "Exit survey signal exists, but survey handoff is not allowed.",
        safe_status: "blocked",
        survey_type: status.survey_type,
        failure_count: status.failures.length,
      },
      {
        card_type: "SERVICE_BOUNDARY",
        headline: "Respect boundary",
        body: "No pressure, no punishment, no forced response, and no identity exposure.",
        safe_status: "respect_boundary",
      },
    ];
  }

  function buildSurveyReadyCards(status) {
    const cards = [
      {
        card_type: "EXIT_SURVEY_READY",
        headline: status.display_summary.headline || "Exit survey ready",
        body: status.display_summary.body || "Optional exit survey is ready with thank-you language and safe references only.",
        safe_status: "survey_ready",
        survey_type: status.survey_type,
      },
      {
        card_type: "STATE_THE_PROBLEM",
        headline: "State the problem.",
        body: buildStateProblemBody(status),
        safe_status: "state_the_problem_allowed",
      },
    ];

    const referenceCard = buildSafeReferenceCard(status);

    if (referenceCard) {
      cards.push(referenceCard);
    }

    if (status.survey_packet_summary.packet_present) {
      cards.push({
        card_type: "SURVEY_PACKET",
        headline: "Optional survey packet ready",
        body: buildSurveyPacketBody(status),
        safe_status: status.survey_packet_summary.provider_ready
          ? "provider_ready"
          : "provider_not_ready",
      });
    }

    cards.push(buildThankYouCard(status));
    cards.push(buildServiceBoundaryCard());

    return cards;
  }

  function buildSurveyAnsweredCards(status) {
    const cards = [
      {
        card_type: "EXIT_SURVEY_ANSWERED",
        headline: "Exit survey answered",
        body: "Exit survey response was recorded safely.",
        safe_status: "survey_answered",
      },
      {
        card_type: "SURVEY_TRUTH",
        headline: "Survey truth recorded",
        body: "The person stated facts from their perspective.",
        safe_status: "survey_truth_recorded",
      },
    ];

    if (status.rant_summary.rant_allowed) {
      cards.push({
        card_type: "STATE_THE_PROBLEM_RECORDED",
        headline: "State the problem stayed open",
        body: buildRantBody(status),
        safe_status: "state_the_problem_recorded",
      });
    }

    cards.push(buildThankYouCard(status));
    cards.push(buildServiceBoundaryCard());

    return cards;
  }

  function buildSurveySkippedCards(status) {
    return [
      {
        card_type: "EXIT_SURVEY_SKIPPED",
        headline: "Exit survey skipped",
        body: "The person chose to skip the optional survey.",
        safe_status: "survey_skipped",
      },
      buildThankYouCard(status),
      buildServiceBoundaryCard(),
    ];
  }

  function buildSurveyDeclinedCards(status) {
    return [
      {
        card_type: "EXIT_SURVEY_DECLINED",
        headline: "Exit survey declined",
        body: "The person declined the optional survey.",
        safe_status: "survey_declined",
      },
      buildThankYouCard(status),
      buildServiceBoundaryCard(),
    ];
  }

  function buildSurveyResponseRecordedCards(status) {
    return [
      {
        card_type: "EXIT_SURVEY_RESPONSE_RECORDED",
        headline: "Exit survey response recorded",
        body: "Exit survey response state was recorded safely.",
        safe_status: "survey_response_recorded",
      },
      buildThankYouCard(status),
      buildServiceBoundaryCard(),
    ];
  }

  function buildDoNotContactCards(status) {
    return [
      {
        card_type: "DO_NOT_CONTACT_RECORDED",
        headline: "Do-not-contact recorded",
        body: "No further exit survey outreach should be sent for this lane.",
        safe_status: "do_not_contact_recorded",
      },
      buildThankYouCard(status),
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
        card_type: "EXIT_SURVEY_UNKNOWN",
        headline: "Exit survey state unknown",
        body: "Exit survey status exists but does not match a known NET state.",
        safe_status: "unknown",
        ledger_state: status.ledger_state,
      },
    ];
  }

  function buildStateProblemBody(status) {
    const parts = [];

    parts.push("Please state your facts in your perspective.");

    if (status.question) {
      parts.push(status.question);
    }

    if (status.rant_summary.rant_allowed) {
      parts.push("Blunt feedback stays allowed.");
    }

    return parts.join(" ");
  }

  function buildRantBody(status) {
    if (!status.rant_summary.rant_present) {
      return "Feedback was recorded without a strong-rant signal.";
    }

    if (status.rant_summary.rant_value_level === "full_rant") {
      return "A full problem statement was recorded as repair-value feedback.";
    }

    if (status.rant_summary.rant_value_level === "rant_signal") {
      return "A strong problem signal was recorded as repair-value feedback.";
    }

    return "Problem feedback was recorded as safe survey truth.";
  }

  function buildSurveyPacketBody(status) {
    const pieces = [];

    if (status.survey_packet_summary.optional) {
      pieces.push("optional");
    }

    if (status.survey_packet_summary.question) {
      pieces.push("one question ready");
    }

    if (status.survey_packet_summary.feedback_url_present) {
      pieces.push("feedback path present");
    }

    if (status.survey_packet_summary.offer_url_present) {
      pieces.push("offer path present");
    }

    if (status.survey_packet_summary.thank_you_required) {
      pieces.push("thank you required");
    }

    if (!status.survey_packet_summary.pressure_allowed) {
      pieces.push("no pressure");
    }

    if (!status.survey_packet_summary.punishment_allowed) {
      pieces.push("no punishment");
    }

    if (!status.survey_packet_summary.termination_stop_allowed) {
      pieces.push("does not stop termination");
    }

    return pieces.join(" · ");
  }

  function buildThankYouCard(status) {
    return {
      card_type: "THANK_YOU",
      headline: "Thank you",
      body: status.thank_you_summary.message || "Thank you.",
      safe_status: status.thank_you_summary.thank_you_present
        ? "thank_you_present"
        : "thank_you_required",
    };
  }

  function buildServiceBoundaryCard() {
    return {
      card_type: "SERVICE_BOUNDARY",
      headline: "Service boundary",
      body: "No pressure. No punishment. No identity exposure.",
      safe_status: "service_boundary",
    };
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

    if (status.termination_reference_id) {
      references.push("termination reference");
    }

    if (status.archive_reference_id) {
      references.push("archive reference");
    }

    if (status.recovery_review_id) {
      references.push("recovery review reference");
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
      row_id: makeId("accountContinuityExitSurveyNetPaperRow"),
      survey_id: status.survey_id,
      received_at: status.received_at,
      survey_type: status.survey_type,
      net_state: status.net_state,
      has_account_number: Boolean(status.account_number),
      has_account_tag: Boolean(status.account_tag),
      has_masked_uidl_hint: Boolean(status.uidl_hint),
      has_report_id: Boolean(status.report_id),
      has_termination_reference: Boolean(status.termination_reference_id),
      has_archive_reference: Boolean(status.archive_reference_id),
      has_recovery_review_reference: Boolean(status.recovery_review_id),
      packet_present: status.survey_summary.packet_present,
      provider_ready: status.survey_summary.provider_ready,
      response_present: status.response_summary.response_present,
      answered: status.response_summary.answered,
      skipped: status.response_summary.skipped,
      declined: status.response_summary.declined,
      requested_no_contact: status.response_summary.requested_no_contact,
      thank_you_present: status.thank_you_summary.thank_you_present,
      state_the_problem_allowed: status.rant_summary.rant_allowed,
      problem_statement_present: status.response_summary.safe_feedback_present,
      rant_signal_present: status.rant_summary.rant_present,
      rant_value_level: status.rant_summary.rant_value_level,
      failure_count: status.failures.length,
      boundary: "NET_RECEIVES_EXIT_SURVEY_SAFE_STATUS_STATE_THE_PROBLEM_THANK_YOU_NO_PRESSURE_NO_PUNISHMENT_NO_IDENTITY_EXPOSURE",
    };
  }

  function listStatuses(filter = {}) {
    const cleanFilter = filter && typeof filter === "object" ? filter : {};
    const surveyId = normalizeText(cleanFilter.survey_id);
    const reportId = normalizeText(cleanFilter.report_id);
    const netState = normalizeText(cleanFilter.net_state);
    const status = normalizeText(cleanFilter.status);
    const surveyType = normalizeText(cleanFilter.survey_type);

    return receivedStatuses
      .filter((item) => {
        if (surveyId && item.survey_id !== surveyId) {
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

        if (surveyType && item.survey_type !== surveyType) {
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
  module.exports = AccountContinuityExitSurveyStatusReceiver;
}
