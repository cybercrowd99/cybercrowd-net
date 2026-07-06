// src/net/cybercade-game-room-status-receiver.js
// CyberCrowd NET — CyberCade Game Room Status Receiver
// Department: CyberCare
// Room: CyberCade
// Owns: receiving Core CyberCade room status summaries,
// preparing NET-safe display cards, adapter audit rows,
// paper ladder rows, and share-safe game room status packets.
// Rule: Teach the difference. Playtime is learn time.
// Do not shame the child.
// Pictures stay source. Only results move.
// Chat OFF. Child identity OFF. Parent approval ON.
// Does not: move raw pictures, expose child identity, publish kid names,
// show child faces, expose address/school/parent identity,
// create child chat, direct message, public child profile,
// shame children, punish children, replace parenting,
// sell child data, make unsafe chores, or override parent approval.

const CyberCadeGameRoomStatusReceiver = (() => {
  const displays = [];

  const DISPLAY_STATES = [
    "room_open_display",
    "game_ready_display",
    "cleanup_display",
    "cleanup_parent_check_display",
    "spot_difference_display",
    "spot_difference_parent_check_display",
    "reward_ready_display",
    "completed_display",
    "blocked_display",
    "failed_display",
    "status_display",
    "unknown_display",
  ];

  const SAFE_STATUS_TYPES = [
    "room_opened",
    "game_started",
    "overlay_session_created",
    "cleanup_active",
    "cleanup_waiting_parent",
    "cleanup_confirmed",
    "spot_difference_active",
    "spot_difference_waiting_parent",
    "spot_difference_confirmed",
    "reward_ready",
    "blocked",
    "completed",
    "failed",
    "status_ready",
    "unknown",
  ];

  function now() {
    return new Date().toISOString();
  }

  function clone(value) {
    if (value === undefined) {
      return undefined;
    }

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
      .map((item) => {
        if (typeof item === "string") {
          return item.trim();
        }

        return item;
      })
      .filter((item) => {
        if (typeof item === "string") {
          return Boolean(item);
        }

        return Boolean(item);
      });
  }

  function normalizeSafeReference(value) {
    const clean = normalizeText(value);

    if (!clean) {
      return "";
    }

    return clean
      .replace(/[<>]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function sanitizeSafeText(value) {
    const clean = normalizeText(value);

    if (!clean) {
      return "";
    }

    return clean
      .replace(/\bpassword\b/gi, "credential")
      .replace(/\btoken\b/gi, "credential")
      .replace(/\bsecret\b/gi, "protected detail")
      .replace(/\bprivate proof\b/gi, "private verification")
      .replace(/\bidentity evidence\b/gi, "verification detail")
      .replace(/\bhome address\b/gi, "protected location detail")
      .replace(/\bphone number\b/gi, "protected contact detail")
      .replace(/\baddress\b/gi, "protected location detail")
      .replace(/\bschool\b/gi, "protected location detail")
      .replace(/\braw uIDL\b/gi, "protected uIDL")
      .replace(/\bfull uIDL\b/gi, "protected uIDL")
      .replace(/\bchild identity\b/gi, "protected child detail")
      .replace(/\bminor identity\b/gi, "protected child detail")
      .replace(/\bkid name\b/gi, "protected player detail")
      .replace(/\bchild name\b/gi, "protected player detail")
      .replace(/\bface photo\b/gi, "protected image detail")
      .replace(/\bprivate room\b/gi, "protected room detail")
      .replace(/\bparent identity\b/gi, "protected adult detail")
      .replace(/\bbathroom picture\b/gi, "blocked picture detail")
      .replace(/\bbody picture\b/gi, "blocked picture detail")
      .replace(/\bchat\b/gi, "game display");
  }

  function containsRawPicture(value) {
    if (!value || typeof value !== "object") {
      return false;
    }

    if (Array.isArray(value)) {
      return value.some(containsRawPicture);
    }

    const rawKeys = [
      "raw_picture",
      "raw_photo",
      "raw_image",
      "raw_picture_base64",
      "raw_photo_base64",
      "base64",
      "data_url",
      "image_bytes",
      "file_blob",
      "blob",
      "buffer",
    ];

    return Object.keys(value).some((key) => {
      if (rawKeys.includes(key) && value[key]) {
        return true;
      }

      return containsRawPicture(value[key]);
    });
  }

  function normalizeStatusType(value) {
    const clean = normalizeText(value).toLowerCase();

    if (SAFE_STATUS_TYPES.includes(clean)) {
      return clean;
    }

    return "unknown";
  }

  function normalizeGameName(value) {
    const clean = normalizeText(value);

    if (!clean) {
      return "PixelPrix";
    }

    const lower = clean.toLowerCase();

    if (lower === "pixelprix" || lower === "pixel prix" || lower === "pixel_prix") {
      return "PixelPrix";
    }

    return sanitizeSafeText(clean);
  }

  function normalizeIncomingStatus(input = {}) {
    const cleanInput = requireObject(input, "CYBERCADE_STATUS_RECEIVER_INPUT_REQUIRED");

    if (containsRawPicture(cleanInput)) {
      return {
        blocked_raw_picture: true,
        entry_id: "",
        route_id: "",
        request_id: "",
        source: "net_receiver_guard",
        department: "CyberCare",
        room: "CyberCade",
        game_name: "PixelPrix",
        room_state: "blocked_raw_picture",
        status_type: "blocked",
        status_message: "Raw picture blocked. Pictures stay source. Only results move.",
        phase: "",
        mode: "",
        cleanup_target_count: 0,
        cleanup_completed_count: 0,
        cleanup_completion_percent: 0,
        difference_marker_count: 0,
        difference_spotted_count: 0,
        difference_completion_percent: 0,
        reward_ready: false,
        reinforcement_question: "Can you spot the difference?",
        teaching_goal: "dirty vs clean",
        notes: [],
      };
    }

    const summary = cleanInput.share_safe_summary || cleanInput.summary || cleanInput;

    return {
      blocked_raw_picture: false,
      entry_id: normalizeSafeReference(cleanInput.entry_id || summary.entry_id),
      route_id: normalizeSafeReference(cleanInput.route_id || summary.route_id),
      request_id: normalizeSafeReference(cleanInput.request_id || summary.request_id),
      source: sanitizeSafeText(cleanInput.source) || "core_cybercade_game_room_status_ledger",
      department: "CyberCare",
      room: "CyberCade",
      game_name: normalizeGameName(cleanInput.game_name || summary.game_name),
      action: sanitizeSafeText(cleanInput.action || summary.action),
      room_state: sanitizeSafeText(cleanInput.room_state || summary.room_state),
      status_type: normalizeStatusType(cleanInput.status_type || summary.status_type),
      status_message: sanitizeSafeText(cleanInput.status_message || summary.status_message),
      phase: sanitizeSafeText(cleanInput.phase || summary.phase),
      mode: sanitizeSafeText(cleanInput.mode || summary.mode),
      cleanup_target_count: normalizeNumber(
        cleanInput.cleanup_target_count,
        summary.cleanup_target_count || 0
      ),
      cleanup_completed_count: normalizeNumber(
        cleanInput.cleanup_completed_count,
        summary.cleanup_completed_count || 0
      ),
      cleanup_completion_percent: normalizeNumber(
        cleanInput.cleanup_completion_percent,
        summary.cleanup_completion_percent || 0
      ),
      difference_marker_count: normalizeNumber(
        cleanInput.difference_marker_count,
        summary.difference_marker_count || 0
      ),
      difference_spotted_count: normalizeNumber(
        cleanInput.difference_spotted_count,
        summary.difference_spotted_count || 0
      ),
      difference_completion_percent: normalizeNumber(
        cleanInput.difference_completion_percent,
        summary.difference_completion_percent || 0
      ),
      reward_ready: normalizeBoolean(cleanInput.reward_ready || summary.reward_ready),
      reinforcement_question:
        sanitizeSafeText(cleanInput.reinforcement_question || summary.reinforcement_question) ||
        "Can you spot the difference?",
      teaching_goal: sanitizeSafeText(cleanInput.teaching_goal || summary.teaching_goal) || "dirty vs clean",
      notes: normalizeList(cleanInput.notes).map(sanitizeSafeText),
    };
  }

  function receiveStatus(input = {}) {
    const status = normalizeIncomingStatus(input);
    const displayState = deriveDisplayState(status);

    const display = {
      display_id: makeId("cybercadeRoomStatusDisplay"),
      received_at: now(),
      department: "CyberCare",
      room: "CyberCade",
      game_name: status.game_name,
      source: status.source,
      entry_id: status.entry_id,
      route_id: status.route_id,
      request_id: status.request_id,
      action: status.action,
      room_state: status.room_state,
      status_type: status.status_type,
      status_message: status.status_message || buildDisplayMessage(status),
      display_state: displayState,
      share_safe_summary: buildShareSafeSummary(status, displayState),
      cybercade_status_card: buildCyberCadeStatusCard(status, displayState),
      pixelprix_game_card: buildPixelPrixGameCard(status, displayState),
      cleanup_card: buildCleanupCard(status),
      spot_difference_card: buildSpotDifferenceCard(status),
      reward_card: buildRewardCard(status),
      safety_card: buildSafetyCard(status),
      adapter_audit_row: buildAdapterAuditRow(status, displayState),
      paper_ladder_row: buildPaperLadderRow(status, displayState),
      boundary: buildBoundary(),
      allowed_outputs: buildAllowedOutputs(),
      blocked_outputs: buildBlockedOutputs(),
      notes: buildDisplayNotes(status),
    };

    displays.push(clone(display));

    return clone(display);
  }

  function receiveRoomStatus(input = {}) {
    return receiveStatus(input);
  }

  function deriveDisplayState(status) {
    if (status.blocked_raw_picture) {
      return "blocked_display";
    }

    if (status.status_type === "blocked") {
      return "blocked_display";
    }

    if (status.status_type === "failed") {
      return "failed_display";
    }

    if (status.status_type === "room_opened") {
      return "room_open_display";
    }

    if (status.status_type === "game_started") {
      return "game_ready_display";
    }

    if (
      status.status_type === "overlay_session_created" ||
      status.status_type === "cleanup_active"
    ) {
      return "cleanup_display";
    }

    if (
      status.status_type === "cleanup_waiting_parent" ||
      status.status_type === "cleanup_confirmed"
    ) {
      return "cleanup_parent_check_display";
    }

    if (status.status_type === "spot_difference_active") {
      return "spot_difference_display";
    }

    if (
      status.status_type === "spot_difference_waiting_parent" ||
      status.status_type === "spot_difference_confirmed"
    ) {
      return "spot_difference_parent_check_display";
    }

    if (status.status_type === "reward_ready") {
      return "reward_ready_display";
    }

    if (status.status_type === "completed") {
      return "completed_display";
    }

    if (status.status_type === "status_ready") {
      return "status_display";
    }

    return "unknown_display";
  }

  function buildDisplayMessage(status) {
    if (status.blocked_raw_picture) {
      return "Raw picture blocked. Pictures stay source. Only results move.";
    }

    if (status.status_type === "room_opened") {
      return "CyberCade room opened.";
    }

    if (status.status_type === "game_started") {
      return "PixelPrix is ready.";
    }

    if (status.status_type === "cleanup_active") {
      return "Clean Up is active.";
    }

    if (status.status_type === "cleanup_confirmed") {
      return "Clean Up confirmed by parent.";
    }

    if (status.status_type === "spot_difference_active") {
      return "Spot the Difference is active.";
    }

    if (status.status_type === "reward_ready") {
      return "Reward ready with parent approval.";
    }

    if (status.status_type === "completed") {
      return "CyberCade game complete.";
    }

    if (status.status_type === "blocked") {
      return "CyberCade status blocked safely.";
    }

    return "CyberCade room status received.";
  }

  function buildShareSafeSummary(status, displayState) {
    return {
      net_summary_id: makeId("cybercadeRoomNetShareSafeSummary"),
      prepared_at: now(),
      department: "CyberCare",
      room: "CyberCade",
      game_name: status.game_name,
      entry_id: status.entry_id,
      route_id: status.route_id,
      request_id: status.request_id,
      room_state: status.room_state,
      status_type: status.status_type,
      display_state: displayState,
      message: status.status_message || buildDisplayMessage(status),
      cleanup_target_count: status.cleanup_target_count,
      cleanup_completed_count: status.cleanup_completed_count,
      cleanup_completion_percent: status.cleanup_completion_percent,
      difference_marker_count: status.difference_marker_count,
      difference_spotted_count: status.difference_spotted_count,
      difference_completion_percent: status.difference_completion_percent,
      reward_ready: status.reward_ready,
      reinforcement_question: status.reinforcement_question,
      teaching_goal: status.teaching_goal,
      pictures: "SOURCE_ONLY",
      results: "MAY_MOVE",
      raw_pictures: "DO_NOT_MOVE",
      chat: "OFF",
      child_identity: "OFF",
      parent_approval: "ON",
      playtime_is_learn_time: true,
      no_shame: true,
    };
  }

  function buildCyberCadeStatusCard(status, displayState) {
    return {
      card_id: makeId("cybercadeRoomNetStatusCard"),
      created_at: now(),
      card_type: "cybercade_room_status",
      title: "CYBERCADE ROOM STATUS",
      department: "CyberCare",
      room: "CyberCade",
      game_name: status.game_name,
      status: status.status_type,
      room_state: status.room_state,
      display_state: displayState,
      message: status.status_message || buildDisplayMessage(status),
      game_structure: "two_games_in_one_same_game",
      game_parts: [
        "Clean Up",
        "Spot the Difference",
      ],
      rule: [
        "Teach the difference.",
        "Playtime is learn time.",
        "Do not shame the child.",
        "Pictures stay source.",
        "Only results move.",
      ],
      safety: {
        chat: "OFF",
        child_identity: "OFF",
        parent_approval: "ON",
      },
    };
  }

  function buildPixelPrixGameCard(status, displayState) {
    return {
      card_id: makeId("pixelPrixNetGameCard"),
      created_at: now(),
      card_type: "pixelprix_game_room_card",
      title: "PIXELPRIX",
      display_state: displayState,
      game_structure: "two_games_in_one_same_game",
      clean_up: {
        target_count: status.cleanup_target_count,
        completed_count: status.cleanup_completed_count,
        completion_percent: status.cleanup_completion_percent,
      },
      spot_the_difference: {
        marker_count: status.difference_marker_count,
        spotted_count: status.difference_spotted_count,
        completion_percent: status.difference_completion_percent,
        question: status.reinforcement_question,
        teaching_goal: status.teaching_goal,
      },
      reward_ready: status.reward_ready,
      pictures: "SOURCE_ONLY",
      results: "MAY_MOVE",
    };
  }

  function buildCleanupCard(status) {
    return {
      card_id: makeId("cybercadeCleanupCard"),
      created_at: now(),
      card_type: "cleanup_status",
      title: "CLEAN UP",
      target_count: status.cleanup_target_count,
      completed_count: status.cleanup_completed_count,
      completion_percent: status.cleanup_completion_percent,
      parent_check:
        status.status_type === "cleanup_waiting_parent" ||
        status.status_type === "cleanup_confirmed",
      display_line: buildCompletionLine(
        status.cleanup_completed_count,
        status.cleanup_target_count,
        status.cleanup_completion_percent
      ),
      pictures: "SOURCE_ONLY",
      results: "MAY_MOVE",
    };
  }

  function buildSpotDifferenceCard(status) {
    return {
      card_id: makeId("cybercadeSpotDifferenceCard"),
      created_at: now(),
      card_type: "spot_difference_status",
      title: "SPOT THE DIFFERENCE",
      reinforcement_question: status.reinforcement_question,
      teaching_goal: status.teaching_goal,
      marker_count: status.difference_marker_count,
      spotted_count: status.difference_spotted_count,
      completion_percent: status.difference_completion_percent,
      parent_check:
        status.status_type === "spot_difference_waiting_parent" ||
        status.status_type === "spot_difference_confirmed",
      display_line: buildCompletionLine(
        status.difference_spotted_count,
        status.difference_marker_count,
        status.difference_completion_percent
      ),
      no_shame: true,
    };
  }

  function buildRewardCard(status) {
    return {
      card_id: makeId("cybercadeRewardCard"),
      created_at: now(),
      card_type: "reward_status",
      title: "REWARD",
      reward_ready: status.reward_ready,
      parent_approval: "ON",
      unlock_rule: "Parent confirms before reward unlocks.",
      no_shame: true,
    };
  }

  function buildSafetyCard(status) {
    return {
      card_id: makeId("cybercadeSafetyCard"),
      created_at: now(),
      card_type: "cybercade_safety_boundary",
      title: "CYBERCADE SAFETY",
      teach_the_difference: true,
      playtime_is_learn_time: true,
      do_not_shame_child: true,
      pictures_stay_source: true,
      only_results_move: true,
      chat: "OFF",
      child_identity: "OFF",
      parent_approval: "ON",
      raw_pictures: "DO_NOT_MOVE",
      no_direct_pvp: true,
      no_exact_location: true,
      no_public_child_profile: true,
      blocked_raw_picture: status.blocked_raw_picture === true,
    };
  }

  function buildAdapterAuditRow(status, displayState) {
    return {
      audit_row_id: makeId("cybercadeNetAdapterAuditRow"),
      created_at: now(),
      adapter: "NET",
      receiver: "CyberCadeGameRoomStatusReceiver",
      department: "CyberCare",
      room: "CyberCade",
      game_name: status.game_name,
      entry_id: status.entry_id,
      route_id: status.route_id,
      request_id: status.request_id,
      status_type: status.status_type,
      room_state: status.room_state,
      display_state: displayState,
      raw_picture_received: false,
      raw_picture_blocked: status.blocked_raw_picture === true,
      pictures_stay_source: true,
      only_results_move: true,
      child_identity_off: true,
      chat_off: true,
      parent_approval_on: true,
      no_shame: true,
    };
  }

  function buildPaperLadderRow(status, displayState) {
    return {
      row_id: makeId("cybercadeNetStatusPaperRow"),
      received_at: now(),
      department: "CyberCare",
      room: "CyberCade",
      game_name: status.game_name,
      entry_id: status.entry_id,
      route_id: status.route_id,
      request_id: status.request_id,
      status_type: status.status_type,
      room_state: status.room_state,
      display_state: displayState,
      cleanup_completion_percent: status.cleanup_completion_percent,
      difference_completion_percent: status.difference_completion_percent,
      reward_ready: status.reward_ready,
      teach_the_difference: true,
      playtime_is_learn_time: true,
      no_shame: true,
      pictures_stay_source: true,
      only_results_move: true,
      chat_off: true,
      child_identity_off: true,
      parent_approval_on: true,
      boundary: "NET_CYBERCADE_STATUS_RESULTS_ONLY_NO_CHILD_IDENTITY_NO_CHAT",
    };
  }

  function buildCompletionLine(done, total, percent) {
    const cleanDone = normalizeNumber(done, 0);
    const cleanTotal = normalizeNumber(total, 0);
    const cleanPercent = normalizeNumber(percent, 0);

    if (!cleanTotal) {
      return "Waiting for game targets.";
    }

    return `${cleanDone}/${cleanTotal} complete — ${cleanPercent}%`;
  }

  function buildBoundary() {
    return {
      department: "CyberCare",
      room: "CyberCade",
      net_receiver: true,
      cybercare_owns_department: true,
      cybercade_holds_game_room: true,
      pixelprix_first_game: true,
      teach_the_difference: true,
      playtime_is_learn_time: true,
      do_not_shame_child: true,
      pictures_stay_source: true,
      only_results_move: true,
      raw_pictures_move: false,
      public_pictures_allowed: false,
      competition_pictures_allowed: false,
      chat_off: true,
      child_identity_off: true,
      parent_approval_on: true,
      no_direct_pvp: true,
      no_exact_location: true,
      no_public_child_profile: true,
      no_bathroom_picture: true,
      no_body_tracking: true,
      no_shame: true,
    };
  }

  function buildAllowedOutputs() {
    return {
      room_state: true,
      status_type: true,
      status_message: true,
      display_state: true,
      game_card: true,
      cleanup_completion_percent: true,
      difference_completion_percent: true,
      score: true,
      item_count: true,
      spotted_count: true,
      reward_ready: true,
      parent_confirmed_result: true,
      share_safe_summary: true,
      paper_ladder_row: true,
      adapter_audit_row: true,
      raw_picture: false,
      child_identity: false,
      chat: false,
    };
  }

  function buildBlockedOutputs() {
    return [
      "raw_picture",
      "room_photo",
      "bathroom_photo",
      "body_picture",
      "child_face",
      "child_name",
      "address",
      "school",
      "parent_identity",
      "private_family_detail",
      "kid_chat",
      "direct_message",
      "comments",
      "friend_requests",
      "public_child_profile",
      "exact_location",
      "public_feed",
      "shame_score",
      "punishment_engine",
      "unsafe_chore",
    ];
  }

  function buildDisplayNotes(status) {
    const notes = [
      "NET receives status only.",
      "Core owns the status ledger.",
      "CyberCare owns the department.",
      "CyberCade holds the game room.",
      "PixelPrix is the first game inside the room.",
      "Teach the difference.",
      "Playtime is learn time.",
      "Do not shame the child.",
      "Pictures stay source.",
      "Only results move.",
      "Chat OFF.",
      "Child identity OFF.",
      "Parent approval ON.",
    ];

    if (status.status_type === "spot_difference_active") {
      notes.push("Ask: Can you spot the difference?");
    }

    if (status.blocked_raw_picture) {
      notes.push("Raw picture was blocked before NET display.");
    }

    return notes.concat(status.notes || []);
  }

  function listDisplays(filter = {}) {
    const cleanFilter = filter && typeof filter === "object" ? filter : {};
    const displayState = normalizeSafeReference(cleanFilter.display_state);
    const statusType = normalizeStatusType(cleanFilter.status_type);
    const routeId = normalizeSafeReference(cleanFilter.route_id);
    const entryId = normalizeSafeReference(cleanFilter.entry_id);

    return displays
      .filter((display) => {
        if (displayState && display.display_state !== displayState) {
          return false;
        }

        if (
          cleanFilter.status_type &&
          statusType &&
          display.status_type !== statusType
        ) {
          return false;
        }

        if (routeId && display.route_id !== routeId) {
          return false;
        }

        if (entryId && display.entry_id !== entryId) {
          return false;
        }

        return true;
      })
      .map(clone);
  }

  function latestDisplay() {
    if (!displays.length) {
      return null;
    }

    return clone(displays[displays.length - 1]);
  }

  function listShareSafeSummaries(filter = {}) {
    return listDisplays(filter)
      .map((display) => display.share_safe_summary)
      .filter(Boolean);
  }

  function listCyberCadeStatusCards(filter = {}) {
    return listDisplays(filter)
      .map((display) => display.cybercade_status_card)
      .filter(Boolean);
  }

  function listPixelPrixGameCards(filter = {}) {
    return listDisplays(filter)
      .map((display) => display.pixelprix_game_card)
      .filter(Boolean);
  }

  function listSafetyCards(filter = {}) {
    return listDisplays(filter)
      .map((display) => display.safety_card)
      .filter(Boolean);
  }

  function listAdapterAuditRows(filter = {}) {
    return listDisplays(filter)
      .map((display) => display.adapter_audit_row)
      .filter(Boolean);
  }

  function listPaperLadderRows(filter = {}) {
    return listDisplays(filter)
      .map((display) => display.paper_ladder_row)
      .filter(Boolean);
  }

  function listDisplayStates() {
    return DISPLAY_STATES.map((displayState) => {
      return {
        display_state: displayState,
        pictures_stay_source: true,
        only_results_move: true,
        teach_the_difference: true,
        playtime_is_learn_time: true,
        no_shame: true,
        chat_off: true,
        child_identity_off: true,
        parent_approval_on: true,
      };
    });
  }

  function clearDisplays() {
    displays.length = 0;
    return true;
  }

  return {
    receiveStatus,
    receiveRoomStatus,
    listDisplays,
    latestDisplay,
    listShareSafeSummaries,
    listCyberCadeStatusCards,
    listPixelPrixGameCards,
    listSafetyCards,
    listAdapterAuditRows,
    listPaperLadderRows,
    listDisplayStates,
    clearDisplays,
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = CyberCadeGameRoomStatusReceiver;
}
