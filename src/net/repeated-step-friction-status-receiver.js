// src/net/repeated-step-friction-status-receiver.js
// CyberCrowd NET — Repeated Step Friction Status Receiver
// Owns: receiving safe Core repeated-step friction summaries for NET/display transport.
// Rule: Core records friction evidence. NET shows safe status.
// Adapter audit checks the repeat point.
// Friction is sought after for fine tuning.
// Repeating the human is a warning.
// No blame. No punishment. No identity exposure.
// Does not: blame the human, punish the human, block the account,
// expose identity evidence, include private proof, include address/phone/first name/raw uIDL,
// send email, run payments, reopen accounts, or deal directly with customer.

const RepeatedStepFrictionStatusReceiver = (() => {
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

  function normalizeRepeatedSteps(steps) {
    if (!Array.isArray(steps)) {
      return [];
    }

    return steps.map((step) => {
      const cleanStep = step && typeof step === "object" && !Array.isArray(step)
        ? step
        : {};

      return {
        step_key: normalizeText(cleanStep.step_key),
        step_id: normalizeText(cleanStep.step_id),
        step_name: normalizeText(cleanStep.step_name),
        lane: normalizeText(cleanStep.lane),
        surface: normalizeText(cleanStep.surface),
        first_seen_at: normalizeText(cleanStep.first_seen_at),
        last_seen_at: normalizeText(cleanStep.last_seen_at),
        window_ms: normalizeNumber(cleanStep.window_ms, 0),
        event_count: normalizeNumber(cleanStep.event_count, 0),
        failure_count: normalizeNumber(cleanStep.failure_count, 0),
        restart_count: normalizeNumber(cleanStep.restart_count, 0),
        timeout_count: normalizeNumber(cleanStep.timeout_count, 0),
        backtrack_count: normalizeNumber(cleanStep.backtrack_count, 0),
        resend_count: normalizeNumber(cleanStep.resend_count, 0),
        retry_count: normalizeNumber(cleanStep.retry_count, 0),
        verification_repeat_count: normalizeNumber(cleanStep.verification_repeat_count, 0),
        repeat_detected: normalizeBoolean(cleanStep.repeat_detected),
        likely_frustration: normalizeBoolean(cleanStep.likely_frustration),
        safe_tags: normalizeList(cleanStep.safe_tags),
      };
    }).filter((step) => step.step_key || step.step_id || step.step_name);
  }

  function normalizeLanguageSignals(signals) {
    if (!Array.isArray(signals)) {
      return [];
    }

    return signals.map((signal) => {
      const cleanSignal =
        signal && typeof signal === "object" && !Array.isArray(signal)
          ? signal
          : {};

      return {
        signal_id: normalizeText(cleanSignal.signal_id),
        type: normalizeText(cleanSignal.type),
        matched: normalizeText(cleanSignal.matched),
        safe_label: normalizeText(cleanSignal.safe_label),
      };
    }).filter((signal) => signal.type || signal.safe_label);
  }

  function normalizeRepairSignal(signal = {}) {
    if (!signal || typeof signal !== "object" || Array.isArray(signal)) {
      return {
        repair_signal_id: "",
        repair_needed: false,
        signal_type: "",
        state: "",
        score: 0,
        source: "",
        safe_references: [],
        repeated_step_count: 0,
        language_signal_count: 0,
        suggested_next_lane: "",
        suggested_prompt: "",
        doctrine: "",
      };
    }

    return {
      repair_signal_id: normalizeText(signal.repair_signal_id),
      repair_needed: normalizeBoolean(signal.repair_needed),
      signal_type: normalizeText(signal.signal_type),
      state: normalizeText(signal.state),
      score: normalizeNumber(signal.score, 0),
      source: normalizeText(signal.source),
      safe_references: normalizeSafeReferences(signal.safe_references),
      repeated_step_count: normalizeNumber(signal.repeated_step_count, 0),
      language_signal_count: normalizeNumber(signal.language_signal_count, 0),
      suggested_next_lane: normalizeText(signal.suggested_next_lane),
      suggested_prompt: normalizeText(signal.suggested_prompt),
      doctrine: normalizeText(signal.doctrine),
    };
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
      };
    }

    return {
      headline: normalizeText(summary.headline),
      body: normalizeText(summary.body),
      safe_tags: normalizeList(summary.safe_tags),
    };
  }

  function normalizeFrictionSummary(summary = {}) {
    if (!summary || typeof summary !== "object" || Array.isArray(summary)) {
      return {
        state: "",
        score: 0,
        repeated_step_count: 0,
        language_signal_count: 0,
        repair_needed: false,
        suggested_next_lane: "",
        suggested_prompt: "",
        likely_exit_cause: false,
        fine_tuning_needed: false,
        blame_assigned: false,
        punishment_allowed: false,
        human_block_allowed: false,
      };
    }

    return {
      state: normalizeText(summary.state),
      score: normalizeNumber(summary.score, 0),
      repeated_step_count: normalizeNumber(summary.repeated_step_count, 0),
      language_signal_count: normalizeNumber(summary.language_signal_count, 0),
      repair_needed: normalizeBoolean(summary.repair_needed),
      suggested_next_lane: normalizeText(summary.suggested_next_lane),
      suggested_prompt: normalizeText(summary.suggested_prompt),
      likely_exit_cause: normalizeBoolean(summary.likely_exit_cause),
      fine_tuning_needed: normalizeBoolean(summary.fine_tuning_needed),
      blame_assigned: normalizeBoolean(summary.blame_assigned),
      punishment_allowed: normalizeBoolean(summary.punishment_allowed),
      human_block_allowed: normalizeBoolean(summary.human_block_allowed),
    };
  }

  function normalizeFineTuningSummary(summary = {}) {
    if (!summary || typeof summary !== "object" || Array.isArray(summary)) {
      return {
        fine_tuning_signal_present: false,
        sought_after_for_fine_tuning: false,
        reason: "",
        priority: "none",
        recommended_review: "",
        state_the_problem_prompt: "",
        doctrine: "",
      };
    }

    return {
      fine_tuning_signal_present: normalizeBoolean(summary.fine_tuning_signal_present),
      sought_after_for_fine_tuning: normalizeBoolean(summary.sought_after_for_fine_tuning),
      reason: normalizeText(summary.reason),
      priority: normalizeText(summary.priority) || "none",
      recommended_review: normalizeText(summary.recommended_review),
      state_the_problem_prompt: normalizeText(summary.state_the_problem_prompt),
      doctrine: normalizeText(summary.doctrine),
    };
  }

  function normalizeStatus(status = {}) {
    const cleanStatus = requireObject(status, "STATUS_REQUIRED");

    return {
      received_id: makeId("repeatedStepFrictionNetStatus"),
      received_at: now(),
      source: "core.repeated-step-friction-status-ledger",
      detection_id: requireText(cleanStatus.detection_id, "DETECTION_ID_REQUIRED"),
      uidl_hint: normalizeText(cleanStatus.uidl_hint),
      account_number: normalizeText(cleanStatus.account_number),
      account_tag: normalizeText(cleanStatus.account_tag),
      report_id: normalizeText(cleanStatus.report_id),
      survey_id: normalizeText(cleanStatus.survey_id),
      session_id_hint: normalizeText(cleanStatus.session_id_hint),
      lane: normalizeText(cleanStatus.lane),
      surface: normalizeText(cleanStatus.surface),
      status: requireText(cleanStatus.status, "STATUS_REQUIRED"),
      ledger_state: normalizeText(cleanStatus.ledger_state),
      friction_score: normalizeNumber(cleanStatus.friction_score, 0),
      repeated_steps: normalizeRepeatedSteps(cleanStatus.repeated_steps),
      language_signals: normalizeLanguageSignals(cleanStatus.language_signals),
      repair_signal: normalizeRepairSignal(cleanStatus.repair_signal),
      display_summary: normalizeDisplaySummary(cleanStatus.display_summary),
      friction_summary: normalizeFrictionSummary(cleanStatus.friction_summary),
      fine_tuning_summary: normalizeFineTuningSummary(cleanStatus.fine_tuning_summary),
      identity_boundary: normalizeText(cleanStatus.identity_boundary),
      service_boundary: normalizeText(cleanStatus.service_boundary),
    };
  }

  function receiveStatus(status = {}) {
    const normalized = normalizeStatus(status);

    normalized.net_state = deriveNetState(normalized);
    normalized.adapter_audit = buildAdapterAudit(normalized);
    normalized.display_cards = buildDisplayCards(normalized);
    normalized.paper_ladder_row = buildPaperLadderRow(normalized);

    receivedStatuses.push(clone(normalized));

    return clone(normalized);
  }

  function deriveNetState(status) {
    if (status.ledger_state === "critical_repeat_friction") {
      return "critical_repeat_friction";
    }

    if (status.ledger_state === "repeat_friction_detected") {
      return "repeat_friction_detected";
    }

    if (status.ledger_state === "repeat_friction_possible") {
      return "repeat_friction_possible";
    }

    if (status.ledger_state === "no_repeat_friction_detected") {
      return "no_repeat_friction_detected";
    }

    return "unknown";
  }

  function buildAdapterAudit(status) {
    const primaryStep = choosePrimaryRepeatedStep(status.repeated_steps);

    return {
      audit_id: makeId("repeatedStepAdapterAudit"),
      created_at: now(),
      detection_id: status.detection_id,
      adapter: inferAdapter(status, primaryStep),
      lane: primaryStep && primaryStep.lane ? primaryStep.lane : status.lane,
      surface: primaryStep && primaryStep.surface ? primaryStep.surface : status.surface,
      step_repeated: buildStepRepeatedLabel(primaryStep),
      retry_pattern: buildRetryPattern(primaryStep, status),
      needs_audit: status.fine_tuning_summary.fine_tuning_signal_present,
      audit_priority: status.fine_tuning_summary.priority,
      recommended_review: buildRecommendedAuditReview(primaryStep, status),
      no_blame: true,
      no_punishment: true,
      no_identity_exposure: true,
    };
  }

  function choosePrimaryRepeatedStep(steps) {
    if (!steps.length) {
      return null;
    }

    return steps
      .slice()
      .sort((a, b) => {
        const aWeight = scoreStepForAudit(a);
        const bWeight = scoreStepForAudit(b);

        return bWeight - aWeight;
      })[0];
  }

  function scoreStepForAudit(step) {
    let score = 0;

    score += step.event_count;
    score += step.failure_count * 2;
    score += step.restart_count * 3;
    score += step.timeout_count * 2;
    score += step.backtrack_count * 2;
    score += step.resend_count * 2;
    score += step.retry_count * 2;
    score += step.verification_repeat_count;

    if (step.likely_frustration) {
      score += 5;
    }

    return score;
  }

  function inferAdapter(status, step) {
    const lane = step && step.lane ? step.lane : status.lane;
    const surface = step && step.surface ? step.surface : status.surface;

    if (surface) {
      return `${surface}-adapter`;
    }

    if (lane) {
      return `${lane}-adapter`;
    }

    return "unknown-adapter";
  }

  function buildStepRepeatedLabel(step) {
    if (!step) {
      return "none";
    }

    if (step.step_name) {
      return step.step_name;
    }

    if (step.step_id) {
      return step.step_id;
    }

    return step.step_key || "unknown_step";
  }

  function buildRetryPattern(step, status) {
    if (!step) {
      if (status.language_signals.length) {
        return "repeat-language-signal";
      }

      return "none";
    }

    const pieces = [];

    if (step.failure_count > 0) {
      pieces.push(`failure:${step.failure_count}`);
    }

    if (step.restart_count > 0) {
      pieces.push(`restart:${step.restart_count}`);
    }

    if (step.timeout_count > 0) {
      pieces.push(`timeout:${step.timeout_count}`);
    }

    if (step.backtrack_count > 0) {
      pieces.push(`backtrack:${step.backtrack_count}`);
    }

    if (step.resend_count > 0) {
      pieces.push(`resend:${step.resend_count}`);
    }

    if (step.retry_count > 0) {
      pieces.push(`retry:${step.retry_count}`);
    }

    if (step.verification_repeat_count > 0) {
      pieces.push(`verification:${step.verification_repeat_count}`);
    }

    if (!pieces.length && step.event_count > 0) {
      pieces.push(`repeat:${step.event_count}`);
    }

    return pieces.join(" · ");
  }

  function buildRecommendedAuditReview(step, status) {
    if (!status.fine_tuning_summary.fine_tuning_signal_present) {
      return "";
    }

    if (!step) {
      return status.fine_tuning_summary.recommended_review || "Review repeat-language signal.";
    }

    const actions = [];

    if (step.failure_count > 0) {
      actions.push("inspect failure handoff");
    }

    if (step.restart_count > 0) {
      actions.push("preserve progress before restart");
    }

    if (step.timeout_count > 0) {
      actions.push("review timeout window");
    }

    if (step.backtrack_count > 0) {
      actions.push("inspect back-button loop");
    }

    if (step.resend_count > 0) {
      actions.push("review resend state");
    }

    if (step.retry_count > 0) {
      actions.push("review retry copy and step lock");
    }

    if (step.verification_repeat_count > 1) {
      actions.push("audit verification adapter");
    }

    if (!actions.length) {
      actions.push("review repeated step and remove unnecessary repeat");
    }

    return actions.join(" · ");
  }

  function buildDisplayCards(status) {
    const cards = [];

    cards.push(buildStateCard(status));

    if (status.net_state !== "no_repeat_friction_detected") {
      cards.push(buildAdapterAuditCard(status));
      cards.push(buildFineTuningCard(status));
      cards.push(buildRepairEvidenceCard(status));
    }

    if (status.language_signals.length) {
      cards.push(buildLanguageSignalCard(status));
    }

    cards.push(buildServiceBoundaryCard());

    return cards;
  }

  function buildStateCard(status) {
    if (status.net_state === "critical_repeat_friction") {
      return {
        card_type: "CRITICAL_REPEAT_FRICTION",
        headline: status.display_summary.headline || "Critical repeated-step friction",
        body: status.display_summary.body || "Repeated-step friction likely contributed to exit or abandonment.",
        safe_status: "critical_repeat_friction",
        score: status.friction_score,
      };
    }

    if (status.net_state === "repeat_friction_detected") {
      return {
        card_type: "REPEAT_FRICTION_DETECTED",
        headline: status.display_summary.headline || "Repeated-step friction detected",
        body: status.display_summary.body || "Repeated-step friction created repair evidence.",
        safe_status: "repeat_friction_detected",
        score: status.friction_score,
      };
    }

    if (status.net_state === "repeat_friction_possible") {
      return {
        card_type: "REPEAT_FRICTION_POSSIBLE",
        headline: status.display_summary.headline || "Repeated-step friction possible",
        body: status.display_summary.body || "Possible repeated-step frustration should be reviewed.",
        safe_status: "repeat_friction_possible",
        score: status.friction_score,
      };
    }

    if (status.net_state === "no_repeat_friction_detected") {
      return {
        card_type: "NO_REPEAT_FRICTION",
        headline: status.display_summary.headline || "No repeated-step friction",
        body: status.display_summary.body || "No repeated-step friction was detected in this input.",
        safe_status: "no_repeat_friction_detected",
        score: status.friction_score,
      };
    }

    return {
      card_type: "REPEAT_FRICTION_UNKNOWN",
      headline: "Repeated-step friction state unknown",
      body: "Friction status exists but does not match a known NET state.",
      safe_status: "unknown",
      score: status.friction_score,
    };
  }

  function buildAdapterAuditCard(status) {
    return {
      card_type: "ADAPTER_AUDIT",
      headline: "Adapter audit prepared",
      body: buildAdapterAuditBody(status.adapter_audit),
      safe_status: "adapter_audit",
      adapter: status.adapter_audit.adapter,
      lane: status.adapter_audit.lane,
      surface: status.adapter_audit.surface,
      step_repeated: status.adapter_audit.step_repeated,
      retry_pattern: status.adapter_audit.retry_pattern,
      needs_audit: status.adapter_audit.needs_audit,
      audit_priority: status.adapter_audit.audit_priority,
    };
  }

  function buildAdapterAuditBody(audit) {
    return [
      `adapter: ${audit.adapter || "unknown"}`,
      `lane: ${audit.lane || "unknown"}`,
      `surface: ${audit.surface || "unknown"}`,
      `step: ${audit.step_repeated || "unknown"}`,
      `retry: ${audit.retry_pattern || "none"}`,
      `audit: ${audit.recommended_review || "review not required"}`,
    ].join(" · ");
  }

  function buildFineTuningCard(status) {
    return {
      card_type: "FINE_TUNING_SIGNAL",
      headline: "Fine-tuning signal",
      body: buildFineTuningBody(status),
      safe_status: "fine_tuning_signal",
      priority: status.fine_tuning_summary.priority,
    };
  }

  function buildFineTuningBody(status) {
    if (!status.fine_tuning_summary.fine_tuning_signal_present) {
      return "No fine-tuning signal is present.";
    }

    return [
      "friction is sought after for fine tuning",
      status.fine_tuning_summary.recommended_review || "review repeated step",
      status.fine_tuning_summary.state_the_problem_prompt || "State the problem.",
    ].join(" · ");
  }

  function buildRepairEvidenceCard(status) {
    return {
      card_type: "REPAIR_EVIDENCE",
      headline: "Repair evidence",
      body: buildRepairEvidenceBody(status),
      safe_status: "repair_evidence",
      repair_needed: status.repair_signal.repair_needed,
      suggested_next_lane: status.repair_signal.suggested_next_lane,
    };
  }

  function buildRepairEvidenceBody(status) {
    if (!status.repair_signal.repair_needed) {
      return "No repair signal required.";
    }

    return [
      `repeat steps: ${status.repair_signal.repeated_step_count}`,
      `language signals: ${status.repair_signal.language_signal_count}`,
      status.repair_signal.suggested_prompt || "State the problem.",
    ].join(" · ");
  }

  function buildLanguageSignalCard(status) {
    return {
      card_type: "REPEAT_LANGUAGE_SIGNAL",
      headline: "Repeat language detected",
      body: `${status.language_signals.length} safe repeat-language signal${status.language_signals.length === 1 ? "" : "s"} recorded.`,
      safe_status: "repeat_language_signal",
      signal_count: status.language_signals.length,
    };
  }

  function buildServiceBoundaryCard() {
    return {
      card_type: "SERVICE_BOUNDARY",
      headline: "Service boundary",
      body: "No blame. No punishment. No identity exposure.",
      safe_status: "service_boundary",
    };
  }

  function buildPaperLadderRow(status) {
    return {
      row_id: makeId("repeatedStepFrictionNetPaperRow"),
      detection_id: status.detection_id,
      received_at: status.received_at,
      net_state: status.net_state,
      score: status.friction_score,
      adapter: status.adapter_audit.adapter,
      lane: status.adapter_audit.lane,
      surface: status.adapter_audit.surface,
      step_repeated: status.adapter_audit.step_repeated,
      retry_pattern: status.adapter_audit.retry_pattern,
      needs_audit: status.adapter_audit.needs_audit,
      audit_priority: status.adapter_audit.audit_priority,
      has_account_number: Boolean(status.account_number),
      has_account_tag: Boolean(status.account_tag),
      has_masked_uidl_hint: Boolean(status.uidl_hint),
      has_report_id: Boolean(status.report_id),
      has_survey_id: Boolean(status.survey_id),
      has_session_hint: Boolean(status.session_id_hint),
      repeated_step_count: status.repeated_steps.length,
      language_signal_count: status.language_signals.length,
      repair_needed: status.repair_signal.repair_needed,
      fine_tuning_needed: status.fine_tuning_summary.fine_tuning_signal_present,
      blame_assigned: false,
      punishment_allowed: false,
      boundary: "NET_RECEIVES_REPEATED_STEP_FRICTION_SAFE_STATUS_ADAPTER_AUDIT_FINE_TUNING_NO_BLAME",
    };
  }

  function listStatuses(filter = {}) {
    const cleanFilter = filter && typeof filter === "object" ? filter : {};
    const detectionId = normalizeText(cleanFilter.detection_id);
    const reportId = normalizeText(cleanFilter.report_id);
    const surveyId = normalizeText(cleanFilter.survey_id);
    const netState = normalizeText(cleanFilter.net_state);
    const lane = normalizeText(cleanFilter.lane);
    const adapter = normalizeText(cleanFilter.adapter);

    return receivedStatuses
      .filter((item) => {
        if (detectionId && item.detection_id !== detectionId) {
          return false;
        }

        if (reportId && item.report_id !== reportId) {
          return false;
        }

        if (surveyId && item.survey_id !== surveyId) {
          return false;
        }

        if (netState && item.net_state !== netState) {
          return false;
        }

        if (lane && item.adapter_audit.lane !== lane) {
          return false;
        }

        if (adapter && item.adapter_audit.adapter !== adapter) {
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
  module.exports = RepeatedStepFrictionStatusReceiver;
}
